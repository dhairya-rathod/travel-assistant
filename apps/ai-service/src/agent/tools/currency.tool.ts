import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Currency Converter Tool
export const currencyTool = tool(
  async ({ from, to, amount }) => {
    // TODO: Call ExchangeRate API or Fixer.io
    const rate = 88
    return JSON.stringify({
      from,
      to,
      amount,
      convertedAmount: amount * rate,
    });
  },
  {
    name: 'currency-converter',
    description: 'Convert one currency to another',
    schema: z.object({
      from: z.string(),
      to: z.string(),
      amount: z.number(),
    }),
  },
);
