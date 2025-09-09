import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  CurrentWeather,
  WeatherForecast,
} from '@repo/api/weather/types/index.types';

@Injectable()
export class WeatherService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'externalApi.openWeatherApiUrl',
    );
    this.apiKey = this.configService.get<string>(
      'externalApi.openWeatherApiKey',
    );
  }

  async getCurrentWeather(city: string): Promise<CurrentWeather> {
    try {
      const currentWeatherResponse = await axios.get<CurrentWeather>(
        `${this.baseUrl}/weather`,
        {
          params: {
            q: city,
            units: 'metric',
            appid: this.apiKey,
          },
        },
      );

      return currentWeatherResponse.data;
    } catch (error) {
      const axiosError = error as { response?: { status: number } };
      throw new HttpException(
        'Failed to get weather data',
        axiosError.response?.status || 500,
      );
    }
  }

  async getWeatherForecast(city: string): Promise<WeatherForecast> {
    try {
      const weatherForecastResponse = await axios.get<WeatherForecast>(
        `${this.baseUrl}/forecast`,
        {
          params: {
            q: city,
            units: 'metric',
            appid: this.apiKey,
          },
        },
      );

      return weatherForecastResponse.data;
    } catch (error) {
      const axiosError = error as { response?: { status: number } };
      throw new HttpException(
        'Failed to get weather data',
        axiosError.response?.status || 500,
      );
    }
  }
}
