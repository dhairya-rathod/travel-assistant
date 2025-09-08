import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  AccuWeatherLocationResponse,
  AccuWeatherForecastResponse,
} from './weather.type';

@Injectable()
export class WeatherService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  // /locations/v1/cities/search?apikey=PKg13CjAfN6zbmKE2V7Avm2zLXkkmNWm&q=vadodara
  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'externalApi.accuWeatherApiUrl',
    );
    this.apiKey = this.configService.get<string>(
      'externalApi.accuWeatherApiKey',
    );
  }

  async getWeather(city: string): Promise<AccuWeatherForecastResponse> {
    try {
      const locationResponse = await axios.get<AccuWeatherLocationResponse[]>(
        `${this.baseUrl}/locations/v1/cities/search`,
        {
          params: {
            apikey: this.apiKey,
            q: city,
          },
        },
      );

      if (!locationResponse.data[0].Key) {
        throw new HttpException('City not found', 404);
      }

      const weatherForcastResponse =
        await axios.get<AccuWeatherForecastResponse>(
          `${this.baseUrl}/forecasts/v1/daily/5day/${locationResponse.data[0].Key}`,
          {
            params: {
              apikey: this.apiKey,
              metric: true,
            },
          },
        );

      return weatherForcastResponse.data;
    } catch (error) {
      const axiosError = error as { response?: { status: number } };
      throw new HttpException(
        'Failed to get weather data',
        axiosError.response?.status || 500,
      );
    }
  }
}
