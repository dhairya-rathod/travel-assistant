import { Request, Response } from 'express';
import { TravelAgent } from '../agent/travelAgent';

export class QueryController {
  private readonly agents: Map<string, TravelAgent>;

  constructor() {
    this.agents = new Map();
    this.handleQuery = this.handleQuery.bind(this);
  }

  private getOrCreateAgent(sessionId: string): TravelAgent {
    if (!this.agents.has(sessionId)) {
      this.agents.set(sessionId, new TravelAgent(sessionId));
    }
    return this.agents.get(sessionId)!;
  }

  private cleanupOldSessions() {
    const ONE_HOUR = 60 * 60 * 1000;
    for (const [sessionId, agent] of this.agents.entries()) {
      if (Date.now() - agent.lastAccessTime > ONE_HOUR) {
        this.agents.delete(sessionId);
      }
    }
  }

  public async handleQuery(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const { input: userInput, sessionId, newConversation } = requestData;

      if (!userInput || typeof userInput !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Invalid input. Please provide a valid query string.',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          status: 'error',
          message: 'Session ID is required',
        });
        return;
      }

      const agentExecutor = this.getOrCreateAgent(sessionId);

      if (newConversation) {
        agentExecutor.clearConversation();
      }

      const llmResponse = await agentExecutor.processMessage(userInput);

      this.cleanupOldSessions();

      if (llmResponse.error) {
        res.status(500).json({
          status: 'error',
          message: llmResponse.error.message || 'Error processing the query.',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: llmResponse,
        sessionId,
      });
    } catch (error) {
      console.log('Error handling query:', JSON.stringify(error));
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  // private async handleQueryLegacy(req: Request, res: Response): Promise<void> {
  //   try {
  //     const requestData = req.body;

  //     const agentExecutor = await createTravelAgent();

  //     const result = await agentExecutor.invoke({
  //       input: 'What is the weather in New York on 2024-07-04?',
  //     });

  //     res.status(200).json(result);
  //   } catch (error) {
  //     console.log('Error handling query:', JSON.stringify(error));
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Internal server error',
  //     });
  //   }
  // }
}

export default new QueryController();
