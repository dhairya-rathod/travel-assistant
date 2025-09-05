import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

import { Annotation } from '@langchain/langgraph';
import { HumanMessage, BaseMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { END } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import { START, StateGraph } from '@langchain/langgraph';

import {
  flightSearchTool,
  hotelSearchTool,
  weatherTool,
  currencyTool,
} from './tools';

// ----------- AGENT SETUP ----------- //
const systemPrompt = `
  You are an AI-powered travel assistant.
  Your goal is to help users plan trips by finding flights, hotels, weather forecasts, and currency conversions.

  You have access to the following tools:
  1. Flight Search Tool - find flights between two cities or airports for a given date.
  2. Hotel Search Tool - find hotels in a given city with filters like budget, dates, and proximity to attractions.
  3. Weather Tool - get weather forecasts for a city on given dates.
  4. Currency Converter Tool - convert between different currencies.

  Guidelines:
  - Always choose the most relevant tool based on the user's request.
  - If a query requires multiple steps (e.g., "Plan wme a 3-day trip to Paris"), break it down:
    → Search flights, then hotels, then weather, and summarize results.
  - Present responses in a clear and concise format.
  - When showing options (like flights or hotels), return structured JSON so the UI can render cards/tables.
  - If the user refers to something like "the first option," remember context from the last tool call.
  - If information is missing (like date or budget), politely ask the user to clarify.
  - Never invent data — always use the tools for real information.
  - Keep the tone friendly, helpful, and professional.

  Example Response Format:
  {
    "reply": "Here are 3 flight options from Delhi to Dubai on Oct 15...",
    "data": {
      "flights": [
        { "airline": "Emirates", "price": "$550", "time": "10:00 AM" },
        { "airline": "IndiGo", "price": "$420", "time": "2:00 PM" }
      ]
    }
  }
`;

export async function createTravelAgent() {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash',
    temperature: 0,
  });

  const tools = [flightSearchTool, hotelSearchTool, weatherTool, currencyTool];
  const llmWithTools = llm.bindTools(tools);

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{input}'],
  ]);

  const agent = createToolCallingAgent({
    llm: llmWithTools,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
  });
}

export async function testAgent() {
  const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
    }),
  });
  const tools = [weatherTool];
  const toolNode = new ToolNode<typeof AgentState.State>(tools);

  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash',
    temperature: 0,
    streaming: true,
  }).bindTools(tools);

  const shouldContinue = (
    data: typeof AgentState.State,
  ): 'executeTools' | typeof END => {
    const { messages } = data;
    const lastMsg = messages[messages.length - 1];
    // If the agent called a tool, we should continue. If not, we can end.
    if (
      !('tool_calls' in lastMsg) ||
      !Array.isArray(lastMsg.tool_calls) ||
      !lastMsg?.tool_calls?.length
    ) {
      return END;
    }
    // By returning the name of the next node we want to go to
    // LangGraph will automatically route to that node
    return 'executeTools';
  };

  const callModel = async (
    data: typeof AgentState.State,
    config?: RunnableConfig,
  ): Promise<Partial<typeof AgentState.State>> => {
    const { messages } = data;
    const result = await llm.invoke(messages, config);
    return {
      messages: [result],
    };
  };

  // Define a new graph
  const workflow = new StateGraph(AgentState)
    // Define the two nodes we will cycle between
    .addNode('callModel', callModel)
    .addNode('executeTools', toolNode)
    // Set the entrypoint as `callModel`
    // This means that this node is the first one called
    .addEdge(START, 'callModel')
    // We now add a conditional edge
    .addConditionalEdges(
      // First, we define the start node. We use `callModel`.
      // This means these are the edges taken after the `agent` node is called.
      'callModel',
      // Next, we pass in the function that will determine which node is called next.
      shouldContinue,
    )
    // We now add a normal edge from `tools` to `agent`.
    // This means that after `tools` is called, `agent` node is called next.
    .addEdge('executeTools', 'callModel');

  const app = workflow.compile();

  let finalResult: BaseMessage | undefined;

  const prettyLogOutput = (output: Record<string, any>) => {
    const keys = Object.keys(output);
    const firstItem = output[keys[0]];
    if ('messages' in firstItem) {
      console.log(`(node) ${keys[0]}:`, firstItem.messages[0]);
      console.log('----\n');
    }
  };

  const inputs = {
    messages: [new HumanMessage('What is the weather in New York on 2024-07-04?')],
  };
  for await (const s of await app.stream(inputs)) {
    prettyLogOutput(s);
    if ('callModel' in s && s.callModel.messages?.length) {
      finalResult = s.callModel.messages[0];
    }
  }

  console.log('Final Result: ', finalResult.content);
}
