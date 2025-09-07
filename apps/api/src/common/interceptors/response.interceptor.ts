import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    path: string;
    method: string;
    correlationId?: string;
    version?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  errors?: any[];
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Add processing time header
        response.setHeader('X-Processing-Time', `${processingTime}ms`);

        // Don't transform file downloads, streams, or already transformed responses
        if (this.shouldSkipTransformation(data, response)) {
          return data;
        }

        // Extract pagination info if present
        let pagination;
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'meta' in data
        ) {
          pagination = data.meta;
          data = data.items;
        }

        const transformedResponse: ApiResponse<T> = {
          success: true,
          statusCode: response.statusCode,
          message: this.getSuccessMessage(request.method, response.statusCode),
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            correlationId: request.headers['x-correlation-id'] as string,
            version: (request.headers['accept-version'] as string) || '1',
            ...(pagination && { pagination }),
          },
        };

        // Log successful requests in development
        // if (process.env.NODE_ENV_API === 'development') {
        //   this.logger.log(
        //     `LOG - ${request.method} ${request.url} - ${response.statusCode} - ${processingTime}ms`,
        //   );
        // }

        return transformedResponse;
      }),
      catchError((error) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Add processing time header even for errors
        response.setHeader('X-Processing-Time', `${processingTime}ms`);

        // Log error requests
        this.logger.error(
          `${request.method} ${request.url} - ${error.status || 500} - ${processingTime}ms`,
          error.stack,
        );

        // Re-throw the error to be handled by the exception filter
        throw error;
      }),
    );
  }

  private shouldSkipTransformation(data: any, response: Response): boolean {
    // Skip transformation for specific response types
    const contentType = response.getHeader('content-type') as string;

    if (!contentType) return false;

    // Skip for file downloads, streams, etc.
    const skipContentTypes = [
      'application/octet-stream',
      'application/pdf',
      'image/',
      'video/',
      'audio/',
      'text/csv',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel',
    ];

    const shouldSkip = skipContentTypes.some((type) =>
      contentType.toLowerCase().includes(type),
    );

    // Skip if data is already in the expected format
    const isAlreadyTransformed =
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'statusCode' in data &&
      'meta' in data;

    return shouldSkip || isAlreadyTransformed;
  }

  private getSuccessMessage(method: string, statusCode: number): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return statusCode === 200
          ? 'Data retrieved successfully'
          : 'Request processed successfully';
      case 'POST':
        return statusCode === 201
          ? 'Resource created successfully'
          : 'Data processed successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Request processed successfully';
    }
  }
}
