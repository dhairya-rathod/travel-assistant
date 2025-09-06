import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CurrencyService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'externalApi.currencyConversionApiUrl',
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/',
    );
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    convertedAmount: number;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/${fromCurrency}.json`);

      if (!response.data[fromCurrency][toCurrency]) {
        throw new HttpException('Invalid currency code', 400);
      }

      const rate = response.data[fromCurrency][toCurrency];
      const convertedAmount = amount * rate;

      return {
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount: Number(convertedAmount.toFixed(2)),
      };
    } catch (error) {
      const axiosError = error as { response?: { status: number } };
      throw new HttpException(
        'Failed to convert currency',
        axiosError.response?.status || 500,
      );
    }
  }
}
