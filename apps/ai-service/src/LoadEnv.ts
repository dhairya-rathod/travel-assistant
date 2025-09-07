import dotenv from 'dotenv';

if (process.env.NODE_ENV_API !== 'production') {
  const result = dotenv.config({
    path: './env/.env.local',
  });

  if (result.error) {
    throw result.error;
  }
}
