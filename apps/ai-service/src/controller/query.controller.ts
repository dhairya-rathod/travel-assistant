import { Request, Response } from 'express';
import { TravelAgent } from '../agent/travelAgent';

export class QueryController {
  public async handleQuery(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const userInput = requestData.input;

      if (!userInput || typeof userInput !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Invalid input. Please provide a valid query string.',
        });
        return;
      }
      const agentExecutor = new TravelAgent();
      const llmResponse = await agentExecutor.processMessage(userInput);

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
