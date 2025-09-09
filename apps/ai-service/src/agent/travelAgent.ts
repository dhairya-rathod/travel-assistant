import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatCallOptions,
} from '@langchain/google-genai';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  AIMessageChunk,
  SystemMessage,
} from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { END } from '@langchain/langgraph';
import { START, StateGraph, MemorySaver } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import type { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { StructuredTool as Tool } from '@langchain/core/tools';

import {
  flightSearchTool,
  hotelSearchTool,
  weatherTool,
  currencyTool,
} from './tools';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { travelAgentSystemPrompt } from './prompt';

type AgentStateType = {
  messages: BaseMessage[];
  error?: Error;
};

export interface TravelAgentState {
  messages: BaseMessage[];
  error?: Error;
}

export interface TravelAgentConfig {
  tools: Tool[];
  modelName: string;
  temperature: number;
  streaming: boolean;
  maxRetries: number;
  debug: boolean;
  systemPrompt?: string;
}

export interface TravelAgentResponse {
  content: string;
  error?: Error;
  conversationHistory: BaseMessage[];
}

export class TravelAgent {
  private readonly AgentState;
  private readonly config: TravelAgentConfig;
  private readonly llm: Runnable<
    BaseLanguageModelInput,
    AIMessageChunk,
    GoogleGenerativeAIChatCallOptions
  >;
  private readonly toolNode: ToolNode<AgentStateType>;
  private readonly workflow: StateGraph<AgentStateType>;
  private sessionId: string;
  private conversationHistory: BaseMessage[] = [];
  public lastAccessTime: number;

  constructor(sessionId: string, config: Partial<TravelAgentConfig> = {}) {
    this.sessionId = sessionId;
    this.lastAccessTime = Date.now();
    this.AgentState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      }),
      error: Annotation<Error | undefined>({
        reducer: (_: Error | undefined, y: Error | undefined) => y,
      }),
    });

    this.config = {
      tools: [weatherTool, flightSearchTool, hotelSearchTool, currencyTool],
      modelName: 'gemini-2.0-flash',
      temperature: 0,
      streaming: true,
      maxRetries: 2,
      debug: true,
      systemPrompt: travelAgentSystemPrompt,
      ...config,
    };

    try {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY environment variable is not set');
      }

      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: this.config.modelName,
        temperature: this.config.temperature,
        streaming: this.config.streaming,
      }).bindTools(this.config.tools);

      this.llm = model;
    } catch (error) {
      throw new Error(
        `Failed to initialize language model: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (this.config.systemPrompt) {
      this.conversationHistory.push(
        new SystemMessage(this.config.systemPrompt),
      );
    }

    this.toolNode = new ToolNode(this.config.tools);
    this.workflow = this.setupWorkflow();
  }

  private shouldContinue = (data: any): 'executeTools' | typeof END => {
    const { messages } = data;
    if (!messages?.length) return END;

    const lastMsg = messages[messages.length - 1];
    if (
      !lastMsg ||
      !('tool_calls' in lastMsg) ||
      !Array.isArray(lastMsg.tool_calls) ||
      !lastMsg.tool_calls.length
    ) {
      return END;
    }
    return 'executeTools';
  };

  private async callModel(data: any, config?: RunnableConfig): Promise<any> {
    try {
      const { messages } = data;
      if (!messages?.length) {
        throw new Error('No messages provided to the model');
      }

      const result = await this.llm.invoke(messages, config);

      return {
        messages: [result],
      };
    } catch (error) {
      if (this.config.debug) {
        console.error('Error calling model:', error);
      }

      return {
        messages: [
          new AIMessage({
            content: 'I encountered an error processing your request.',
          }),
        ],
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private setupWorkflow(): StateGraph<any> {
    const workflow = new StateGraph(this.AgentState);

    workflow
      .addNode('callModel', this.callModel.bind(this))
      .addNode('executeTools', this.toolNode)
      .addEdge(START, 'callModel')
      .addConditionalEdges('callModel', this.shouldContinue.bind(this))
      .addEdge('executeTools', 'callModel');

    return workflow;
  }

  private logOutput(output: Record<string, any>): void {
    if (!this.config.debug) return;

    Object.entries(output).forEach(([nodeName, state]) => {
      if (state?.messages?.[0]) {
        console.log(`(node) ${nodeName}:`, state.messages[0]);
        console.log('----\n');
      }
    });
  }

  public clearConversation(): void {
    this.conversationHistory = [];
    if (this.config.systemPrompt) {
      this.conversationHistory.push(
        new SystemMessage(this.config.systemPrompt),
      );
    }
  }

  public async processMessage(message: string): Promise<TravelAgentResponse> {
    try {
      this.lastAccessTime = Date.now();
      const checkpointer = new MemorySaver();

      const config = {
        configurable: {
          thread_id: this.sessionId,
        },
      };

      const app = this.workflow.compile({ checkpointer }).withConfig(config);

      this.conversationHistory.push(new HumanMessage(message));
      const inputs = {
        messages: this.conversationHistory,
      };

      let finalResult: BaseMessage | undefined;

      for await (const state of await app.stream(inputs)) {
        this.logOutput(state);

        if ('callModel' in state && typeof state.callModel === 'object') {
          const modelOutput = state.callModel as {
            messages?: BaseMessage[];
            error?: Error;
          };
          if (modelOutput.error) {
            throw modelOutput.error;
          }
          if (modelOutput.messages?.length) {
            finalResult = modelOutput.messages[0];
            this.conversationHistory = this.conversationHistory.concat(
              modelOutput.messages,
            );
          }
        }
      }

      if (!finalResult) {
        throw new Error('No response generated from the model');
      }

      return {
        content: String(finalResult.content),
        conversationHistory: this.conversationHistory,
      };
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content:
          'I apologize, but I encountered an error while processing your request.',
        error: error instanceof Error ? error : new Error(errorMessage),
        conversationHistory: [],
      };
    }
  }
}
