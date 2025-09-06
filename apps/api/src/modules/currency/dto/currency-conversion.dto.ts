import { IsString, IsNumber, IsNotEmpty, Length } from 'class-validator';

export class CurrencyConversionDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  readonly from: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  readonly to: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;
}
