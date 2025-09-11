import { Controller, Get, Query } from '@nestjs/common';
import { WeatherRequestDto } from '@repo/api/weather/dto/weather-request.dto';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  async current(@Query() queryParams: WeatherRequestDto) {
    return this.weatherService.getCurrentWeather(
      queryParams.city.toLowerCase(),
    );
  }

  @Get('forecast')
  async forecast(@Query() queryParams: WeatherRequestDto) {
    return this.weatherService.getWeatherForecast(
      queryParams.city.toLowerCase(),
    );
  }
}
