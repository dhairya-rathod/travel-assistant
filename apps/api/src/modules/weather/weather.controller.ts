import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherRequestDto } from './dto/weather-request.dto';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  async convert(@Query() queryParams: WeatherRequestDto) {
    return this.weatherService.getWeather(queryParams.city.toLowerCase());
  }
}
