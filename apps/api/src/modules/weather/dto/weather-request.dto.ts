import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class WeatherRequestDto {
  @IsString()
  @IsNotEmpty()
  readonly city: string;
}
