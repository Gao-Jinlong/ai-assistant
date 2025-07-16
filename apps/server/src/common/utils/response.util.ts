import {
  ApiResponse,
  PaginatedResponse,
} from '../interfaces/response.interface';

/**
 * 响应工具类
 * 提供便捷的响应构建方法
 */
export class ResponseUtil {
  static isApiResponse(response: unknown): response is ApiResponse<unknown> {
    return (
      response !== null &&
      typeof response === 'object' &&
      'code' in response &&
      'message' in response
    );
  }
  /**
   * 构建成功响应
   */
  static success<T>(data: T, message = '操作成功'): ApiResponse<T> {
    return {
      code: 0,
      message,
      data,
    };
  }

  /**
   * 构建失败响应
   */
  static error<T = null>(
    code: number,
    message: string,
    data: T = null as T,
  ): ApiResponse<T> {
    return {
      code,
      message,
      data,
    };
  }

  /**
   * 构建分页响应
   */
  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message = '查询成功',
  ): ApiResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(total / pageSize);

    const paginatedData: PaginatedResponse<T> = {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };

    return this.success(paginatedData, message);
  }

  /**
   * 构建列表响应
   */
  static list<T>(data: T[], message = '查询成功'): ApiResponse<T[]> {
    return this.success(data, message);
  }

  /**
   * 构建详情响应
   */
  static detail<T>(data: T, message = '查询成功'): ApiResponse<T> {
    return this.success(data, message);
  }

  /**
   * 构建创建响应
   */
  static created<T>(data: T, message = '创建成功'): ApiResponse<T> {
    return this.success(data, message);
  }

  /**
   * 构建更新响应
   */
  static updated<T>(data: T, message = '更新成功'): ApiResponse<T> {
    return this.success(data, message);
  }

  /**
   * 构建删除响应
   */
  static deleted(message = '删除成功'): ApiResponse<null> {
    return this.success(null, message);
  }
}
