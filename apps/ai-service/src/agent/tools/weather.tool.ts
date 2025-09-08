import axios from 'axios';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Weather Tool
export const weatherTool = tool(
  async ({ city }) => {
    const response = await axios.get(
      `${process.env.API_URL_V1}/weather/forecast`,
      {
        params: { city },
      },
    );
    if (response.status !== 200) {
      throw new Error(`Weather forecast failed with status ${response.status}`);
    }
    return JSON.stringify(response.data.data);
  },
  {
    name: 'weather-forecast',
    description: 'Get weather forecast of 5 days for a given city',
    schema: z.object({
      city: z.string(),
    }),
  },
);
