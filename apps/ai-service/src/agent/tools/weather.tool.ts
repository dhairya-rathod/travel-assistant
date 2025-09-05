import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Weather Tool
export const weatherTool = tool(
  async ({ city, date }) => {
    // TODO: Call OpenWeatherMap API or WeatherAPI
    return JSON.stringify({
      city,
      date,
      forecast: 'Sunny, 25°C',
    });
  },
  {
    name: 'weather-forecast',
    description: 'Get weather forecast for a city on given date',
    schema: z.object({
      city: z.string(),
      date: z.string(),
    }),
  },
);
