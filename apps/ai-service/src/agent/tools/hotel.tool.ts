import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Hotel Search Tool
export const hotelSearchTool = tool(
  async ({ city, checkIn, checkOut, budget }) => {
    // TODO: Call real hotel API (Booking.com, Amadeus, etc.)
    return JSON.stringify([
      { name: 'Hotel Sunshine', price: 120, rating: 4.5 },
      { name: 'City Inn', price: 90, rating: 4.2 },
    ]);
  },
  {
    name: 'hotel-search',
    description: 'Find hotels in a city with filters like budget and dates',
    schema: z.object({
      city: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      budget: z.number().optional(),
    }),
  },
);
