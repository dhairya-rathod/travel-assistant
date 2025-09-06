import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME || 'myapp',
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 20,
  minConnections: parseInt(process.env.DATABASE_MIN_CONNECTIONS, 10) || 2,
}));
