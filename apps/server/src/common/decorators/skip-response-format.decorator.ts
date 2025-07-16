import { SetMetadata } from '@nestjs/common';

/**
 * 跳过响应格式化的元数据键
 */
export const SKIP_RESPONSE_FORMAT_KEY = 'skipResponseFormat';

/**
 * 跳过响应格式化装饰器
 * 用于某些接口不需要进行统一格式化的场景
 */
export const SkipResponseFormat = () =>
  SetMetadata(SKIP_RESPONSE_FORMAT_KEY, true);
