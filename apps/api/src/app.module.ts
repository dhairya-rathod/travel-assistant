import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
// import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
// import { BullModule } from '@nestjs/bull';
// import { CacheModule } from '@nestjs/cache-manager';
// import { ScheduleModule } from '@nestjs/schedule';
// import * as redisStore from 'cache-manager-redis-store';

// Configuration
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import externalApi from './config/external-api.config';
// import { authConfig } from './config/auth.config';
// import { redisConfig } from './config/redis.config';

// Middleware
import { LoggerMiddleware } from './middleware/logger.middleware';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

// Guards & Interceptors
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
// import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
// import { RolesGuard } from './common/guards/roles.guard';
// import { CacheInterceptor } from './common/interceptors/cache.interceptor';

// Feature Modules
import { HealthModule } from './modules/health/health.module';
import { CurrencyModule } from './modules/currency/currency.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { AdminModule } from './modules/admin/admin.module';

// Entities (for TypeORM auto-loading)
// import { User } from './modules/users/entities/user.entity';
// import { RefreshToken } from './modules/auth/entities/refresh-token.entity';

@Module({
  imports: [
    // Configuration - Load environment variables and configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, databaseConfig, externalApi /* authConfig, redisConfig */],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database Configuration with TypeORM
    // TypeOrmModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'postgres',
    //     url: configService.get<string>('database.url'),
    //     host: configService.get<string>('database.host'),
    //     port: configService.get<number>('database.port'),
    //     username: configService.get<string>('database.username'),
    //     password: configService.get<string>('database.password'),
    //     database: configService.get<string>('database.name'),
    //     entities: [User, RefreshToken],
    //     migrations: ['dist/database/migrations/*{.ts,.js}'],
    //     synchronize:
    //       configService.get<string>('app.environment') !== 'production',
    //     logging: configService.get<string>('app.environment') === 'development',
    //     ssl:
    //       configService.get<string>('app.environment') === 'production'
    //         ? { rejectUnauthorized: false }
    //         : false,
    //     retryAttempts: 3,
    //     retryDelay: 3000,
    //     autoLoadEntities: true,
    //     keepConnectionAlive: true,
    //     // Connection pooling for production
    //     extra: {
    //       max: configService.get<number>('database.maxConnections') || 20,
    //       min: configService.get<number>('database.minConnections') || 2,
    //       acquire: 30000,
    //       idle: 10000,
    //     },
    //   }),
    // }),

    // Caching with Redis
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     store: redisStore,
    //     host: configService.get<string>('redis.host'),
    //     port: configService.get<number>('redis.port'),
    //     password: configService.get<string>('redis.password'),
    //     db: configService.get<number>('redis.database') || 0,
    //     ttl: configService.get<number>('redis.ttl') || 300, // 5 minutes default
    //     max: 1000, // Maximum number of items in cache
    //   }),
    // }),

    // Rate Limiting
    // ThrottlerModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     ttl: configService.get<number>('app.rateLimitTtl') || 60,
    //     limit: configService.get<number>('app.rateLimitMax') || 100,
    //     // storage: redisStore,
    //     storageOptions: {
    //       host: configService.get<string>('redis.host'),
    //       port: configService.get<number>('redis.port'),
    //       password: configService.get<string>('redis.password'),
    //     },
    //   }),
    // }),

    // Background Jobs with Bull
    // BullModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     redis: {
    //       host: configService.get<string>('redis.host'),
    //       port: configService.get<number>('redis.port'),
    //       password: configService.get<string>('redis.password'),
    //       db: configService.get<number>('redis.jobDatabase') || 1,
    //     },
    //     defaultJobOptions: {
    //       removeOnComplete: 10,
    //       removeOnFail: 5,
    //       attempts: 3,
    //       backoff: {
    //         type: 'exponential',
    //         delay: 2000,
    //       },
    //     },
    //   }),
    // }),

    // Task Scheduling
    // ScheduleModule.forRoot(),

    // Health Checks
    TerminusModule,

    // Feature Modules
    HealthModule,
    CurrencyModule,
    // AuthModule,
    // UsersModule,
    // AdminModule,
  ],
  controllers: [],
  // providers: [
  // Global Guards
  // {
  //   provide: APP_GUARD,
  //   useClass: ThrottlerGuard,
  // },
  // {
  //   provide: APP_GUARD,
  //   useClass: JwtAuthGuard,
  // },
  // {
  //   provide: APP_GUARD,
  //   useClass: RolesGuard,
  // },
  // Global Interceptors
  // {
  //   provide: APP_INTERCEPTOR,
  //   useClass: LoggingInterceptor,
  // },
  // {
  //   provide: APP_INTERCEPTOR,
  //   useClass: CacheInterceptor,
  // },
  // ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*path')
      .apply(LoggerMiddleware)
      .exclude(
        '/*version/health',
        '/*version/health/*path',
        '/*version/docs',
        '/*version/docs/*path',
      )
      .forRoutes('*path');
  }
}
