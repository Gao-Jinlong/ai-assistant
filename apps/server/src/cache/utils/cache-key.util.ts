/**
 * 缓存键生成工具类
 */
export class CacheKeyUtil {
  /**
   * 生成用户相关的缓存键
   * @param userId 用户ID
   * @param suffix 后缀
   */
  static userKey(userId: string, suffix?: string): string {
    return suffix ? `user:${userId}:${suffix}` : `user:${userId}`;
  }

  /**
   * 生成线程相关的缓存键
   * @param threadId 线程ID
   * @param suffix 后缀
   */
  static threadKey(threadId: string, suffix?: string): string {
    return suffix ? `thread:${threadId}:${suffix}` : `thread:${threadId}`;
  }

  /**
   * 生成消息相关的缓存键
   * @param messageId 消息ID
   * @param suffix 后缀
   */
  static messageKey(messageId: string, suffix?: string): string {
    return suffix ? `message:${messageId}:${suffix}` : `message:${messageId}`;
  }

  /**
   * 生成聊天相关的缓存键
   * @param chatId 聊天ID
   * @param suffix 后缀
   */
  static chatKey(chatId: string, suffix?: string): string {
    return suffix ? `chat:${chatId}:${suffix}` : `chat:${chatId}`;
  }

  /**
   * 生成API相关的缓存键
   * @param endpoint API端点
   * @param params 参数对象
   */
  static apiKey(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return `api:${endpoint}`;
    }
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `api:${endpoint}:${paramString}`;
  }

  /**
   * 生成列表查询的缓存键
   * @param resource 资源名称
   * @param query 查询参数
   */
  static listKey(resource: string, query?: Record<string, any>): string {
    if (!query || Object.keys(query).length === 0) {
      return `list:${resource}`;
    }
    
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');
    
    return `list:${resource}:${queryString}`;
  }

  /**
   * 生成分页查询的缓存键
   * @param resource 资源名称
   * @param page 页码
   * @param limit 每页数量
   * @param filters 过滤条件
   */
  static paginationKey(
    resource: string,
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): string {
    let key = `pagination:${resource}:page=${page}:limit=${limit}`;
    
    if (filters && Object.keys(filters).length > 0) {
      const filterString = Object.keys(filters)
        .sort()
        .map(key => `${key}=${filters[key]}`)
        .join('&');
      key += `:${filterString}`;
    }
    
    return key;
  }

  /**
   * 生成搜索结果的缓存键
   * @param query 搜索查询
   * @param filters 搜索过滤条件
   */
  static searchKey(query: string, filters?: Record<string, any>): string {
    let key = `search:${encodeURIComponent(query)}`;
    
    if (filters && Object.keys(filters).length > 0) {
      const filterString = Object.keys(filters)
        .sort()
        .map(key => `${key}=${filters[key]}`)
        .join('&');
      key += `:${filterString}`;
    }
    
    return key;
  }

  /**
   * 生成计数缓存键
   * @param resource 资源名称
   * @param conditions 计数条件
   */
  static countKey(resource: string, conditions?: Record<string, any>): string {
    let key = `count:${resource}`;
    
    if (conditions && Object.keys(conditions).length > 0) {
      const conditionString = Object.keys(conditions)
        .sort()
        .map(key => `${key}=${conditions[key]}`)
        .join('&');
      key += `:${conditionString}`;
    }
    
    return key;
  }

  /**
   * 生成统计数据的缓存键
   * @param type 统计类型
   * @param period 统计周期（如：daily, weekly, monthly）
   * @param date 统计日期
   */
  static statsKey(type: string, period: string, date?: string): string {
    let key = `stats:${type}:${period}`;
    if (date) {
      key += `:${date}`;
    }
    return key;
  }

  /**
   * 生成会话相关的缓存键
   * @param sessionId 会话ID
   * @param suffix 后缀
   */
  static sessionKey(sessionId: string, suffix?: string): string {
    return suffix ? `session:${sessionId}:${suffix}` : `session:${sessionId}`;
  }

  /**
   * 生成配置相关的缓存键
   * @param configKey 配置键名
   * @param scope 配置范围（如：global, user, system）
   */
  static configKey(configKey: string, scope = 'global'): string {
    return `config:${scope}:${configKey}`;
  }
}