import { registerAs } from '@nestjs/config';

export default registerAs('externalApi', () => ({
  currencyConversionApiUrl:
    process.env.CURRENCY_CONVERSION_API_URL ||
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/',
  accuWeatherApiUrl:
    process.env.ACCUWEATHER_BASE_URL || 'http://dataservice.accuweather.com',
  accuWeatherApiKey: process.env.ACCUWEATHER_API_KEY || '',
}));
