import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyConversionDto } from './dto/currency-conversion.dto';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('convert')
  async convert(@Query() queryParams: CurrencyConversionDto) {
    return this.currencyService.convertCurrency(
      queryParams.amount,
      queryParams.from.toLowerCase(),
      queryParams.to.toLowerCase(),
    );
  }
}
