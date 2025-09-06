import axios from 'axios';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Currency Converter Tool
export const currencyTool = tool(
  async ({ from, to, amount }) => {
    const response = await axios.get(
      `${process.env.API_URL_V1}/currency/convert`,
      {
        params: { from, to, amount },
      },
    );
    if (response.status !== 200) {
      throw new Error(
        `Currency conversion failed with status ${response.status}`,
      );
    }
    return JSON.stringify(response.data.data);
  },
  {
    name: 'currency-converter',
    description: 'Convert one currency to another',
    schema: z.object({
      from: z.string().min(3).max(3),
      to: z.string().min(3).max(3),
      amount: z.number(),
    }),
  },
);
