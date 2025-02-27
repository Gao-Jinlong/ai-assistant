import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // 将 Zod 错误转换为更友好的格式
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new BadRequestException({
          message: '参数验证失败',
          errors,
        });
      }
      throw new BadRequestException('参数验证失败');
    }
  }
}

// 创建一个全局验证管道工厂函数
export const createGlobalZodValidationPipe = (schema: ZodSchema) => {
  return new ZodValidationPipe(schema);
};
