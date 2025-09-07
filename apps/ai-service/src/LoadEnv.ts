import dotenv from 'dotenv';

const result = dotenv.config({
  path: './env/.env',
});

if (result.error) {
  throw result.error;
}
