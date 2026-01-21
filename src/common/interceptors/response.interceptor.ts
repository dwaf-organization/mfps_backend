import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler) {
        const message =
            this.reflector.get<string>(
                'response_message',
                context.getHandler(),
            ) ?? '성공';

    return next.handle().pipe(
        map((data) => ({
            code: 1,
            message,
            data,
        })),
    );
  }
}
