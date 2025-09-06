import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

// Custom decorator for setting timeout per route
export const TIMEOUT_KEY = 'timeout';
export const SetTimeout = (timeoutMs: number) => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(TIMEOUT_KEY, timeoutMs, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata(TIMEOUT_KEY, timeoutMs, target);
    }
  };
};

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly defaultTimeout = 30000; // 30 seconds default

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    // Get timeout from decorator (method-level takes precedence)
    const methodTimeout = this.reflector.get<number>(TIMEOUT_KEY, handler);
    const classTimeout = this.reflector.get<number>(
      TIMEOUT_KEY,
      controllerClass,
    );

    // Determine timeout based on route patterns
    const routeTimeout = this.getRouteSpecificTimeout(
      request.url,
      request.method,
    );

    const timeoutMs =
      methodTimeout || classTimeout || routeTimeout || this.defaultTimeout;

    const startTime = Date.now();

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((error) => {
        const processingTime = Date.now() - startTime;

        if (error instanceof TimeoutError) {
          // Log timeout for monitoring
          this.logger.warn(
            `Request timeout after ${processingTime}ms: ${request.method} ${request.url}`,
            {
              method: request.method,
              url: request.url,
              userAgent: request.headers['user-agent'],
              ip: this.getClientIp(request),
              timeout: timeoutMs,
              processingTime,
              correlationId: request.headers['x-correlation-id'],
            },
          );

          // Return structured timeout error
          return throwError(
            () =>
              new RequestTimeoutException({
                message: 'Request timeout',
                statusCode: 408,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                timeout: `${timeoutMs}ms`,
                processingTime: `${processingTime}ms`,
              }),
          );
        }

        // Re-throw other errors
        return throwError(() => error);
      }),
    );
  }

  private getRouteSpecificTimeout(url: string, method: string): number | null {
    const routes = this.getTimeoutRoutes();

    for (const route of routes) {
      if (this.matchesRoute(url, method, route)) {
        return route.timeout;
      }
    }

    return null;
  }

  private getTimeoutRoutes() {
    return [
      // File upload/download endpoints
      { pattern: '/upload', methods: ['POST'], timeout: 120000 }, // 2 minutes
      { pattern: '/download', methods: ['GET'], timeout: 120000 }, // 2 minutes
      { pattern: '/export', methods: ['GET', 'POST'], timeout: 180000 }, // 3 minutes

      // Report generation
      { pattern: '/reports', methods: ['GET', 'POST'], timeout: 90000 }, // 1.5 minutes

      // Batch operations
      { pattern: '/batch', methods: ['POST', 'PUT'], timeout: 300000 }, // 5 minutes

      // Search endpoints (potentially heavy queries)
      { pattern: '/search', methods: ['GET', 'POST'], timeout: 60000 }, // 1 minute

      // External API integrations
      { pattern: '/integrations', methods: ['GET', 'POST'], timeout: 45000 }, // 45 seconds

      // Authentication endpoints (should be fast)
      { pattern: '/auth/login', methods: ['POST'], timeout: 10000 }, // 10 seconds
      { pattern: '/auth/register', methods: ['POST'], timeout: 15000 }, // 15 seconds
      { pattern: '/auth/refresh', methods: ['POST'], timeout: 5000 }, // 5 seconds

      // Health checks (should be very fast)
      { pattern: '/health', methods: ['GET'], timeout: 5000 }, // 5 seconds

      // Analytics endpoints
      { pattern: '/analytics', methods: ['GET', 'POST'], timeout: 60000 }, // 1 minute

      // Image/video processing
      { pattern: '/media/process', methods: ['POST'], timeout: 180000 }, // 3 minutes

      // Database migrations or admin operations
      { pattern: '/admin/migrate', methods: ['POST'], timeout: 600000 }, // 10 minutes
      { pattern: '/admin/backup', methods: ['POST'], timeout: 1800000 }, // 30 minutes
    ];
  }

  private matchesRoute(url: string, method: string, route: any): boolean {
    // Simple pattern matching - you can enhance this with regex if needed
    const urlMatches = url.includes(route.pattern);
    const methodMatches = route.methods.includes(method.toUpperCase());

    return urlMatches && methodMatches;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}

// Usage examples in controllers:

/*
// Class-level timeout
@SetTimeout(60000) // 1 minute for all methods
@Controller('users')
export class UsersController {
  
  @Get()
  findAll() {
    // Uses class-level timeout of 60 seconds
  }

  @Post('upload')
  @SetTimeout(120000) // Override with 2 minutes for this specific method
  uploadFile() {
    // Uses method-level timeout of 120 seconds
  }
}
*/
