import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Flight Search Tool
export const flightSearchTool = tool(
  async ({ from, to, date }) => {
    // TODO: Call real external flight API here
    return JSON.stringify([
      { airline: 'Emirates', price: 550, time: '10:00' },
      { airline: 'IndiGo', price: 420, time: '14:00' },
    ]);
  },
  {
    name: 'flight-search',
    description: 'Search for flights between two cities on given dates',
    schema: z.object({
      from: z.string().describe('Departure city or airport'),
      to: z.string().describe('Arrival city or airport'),
      date: z.string().describe('Travel date in YYYY-MM-DD format'),
    }),
  },
);
