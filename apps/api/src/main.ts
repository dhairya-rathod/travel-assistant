import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import logger from './common/logger';

async function bootstrap() {
  // Create NestJS application with custom logger
  const app = await NestFactory.create(AppModule, {
    logger,
    cors: false,
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const environment = configService.get<string>('NODE_ENV') || 'development';
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';

  // Trust proxy for proper IP forwarding (important for rate limiting and logging)
  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable if you need to embed resources
    }),
  );

  // Compression middleware
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses larger than 1KB
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // HTTP request logging
  if (environment === 'production') {
    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.log('info', message.trim()) },
      }),
    );
  }

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins =
        configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [];

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (environment === 'development') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  // Global prefix for all routes
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove properties that don't have decorators
      whitelist: true,
      // Throw error if non-whitelisted properties are present
      forbidNonWhitelisted: true,
      // Transform payloads to be objects typed according to their DTO classes
      transform: true,
      // Enable detailed error messages in development
      disableErrorMessages: environment === 'production',
      // Transform string representations of primitives to their actual types
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Validate query parameters, path parameters, and body
      validateCustomDecorators: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  // Global interceptors
  app.useGlobalInterceptors(
    new TimeoutInterceptor(new Reflector()), // Request timeout handling
    new ResponseInterceptor(), // Standardize response format
  );

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.log('🛑 SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('🛑 SIGINT received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Start the server
  await app.listen(port, '0.0.0.0');

  // Log startup information
  const appUrl = await app.getUrl();
  logger.log(`🚀 Application is running on: ${appUrl}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`📊 Health check: ${appUrl}/${apiPrefix}/v1/health`);
}

// Start the application
bootstrap().catch((error) => {
  console.error('💥 Application failed to start:', error);
  process.exit(1);
});
