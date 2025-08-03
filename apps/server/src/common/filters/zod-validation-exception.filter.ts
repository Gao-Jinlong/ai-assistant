import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { ResponseUtil } from '../utils/response.util';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodValidationException)
@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const zodError = exception.getZodError();

    const status = 400;
    const message = this.formatZodError(zodError);
    const code = status;

    const errorResponse = ResponseUtil.error(code, message);

    response.status(status).json(errorResponse);
  }

  formatZodError(zodError: ZodError) {
    return zodError.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
  }
}
