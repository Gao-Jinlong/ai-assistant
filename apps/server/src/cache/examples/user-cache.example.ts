import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CacheService } from '../cache.service';
import { CacheKeyUtil } from '../utils/cache-key.util';
import { Cacheable, CacheEvict } from '../decorators/cache.decorator';
import { Public } from '@server/auth/public.decorator';

/**
 * 用户缓存使用示例
 * 展示如何在服务中使用缓存模块
 */
@Public()
@Controller('user-cache-example')
export class UserCacheExample {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * 示例1：手动缓存用户信息
   */
  @Get(':userId/profile')
  async getUserProfile(@Param('userId') userId: string) {
    const cacheKey = CacheKeyUtil.userKey(userId, 'profile');

    // 尝试从缓存获取
    const cachedProfile = await this.cacheService.get(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }

    // 从数据库获取（模拟）
    const profile = await this.fetchUserFromDatabase(userId);

    // 缓存结果，TTL 为 10 分钟
    await this.cacheService.set(cacheKey, profile, 600);

    return profile;
  }

  /**
   * 示例2：使用 getOrSet 方法
   */
  @Get(':userId/settings')
  async getUserSettings(@Param('userId') userId: string) {
    const cacheKey = CacheKeyUtil.userKey(userId, 'settings');

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.fetchUserSettingsFromDatabase(userId),
      300, // 5 分钟 TTL
    );
  }

  /**
   * 示例3：使用装饰器进行缓存（需要配合拦截器）
   */
  @Cacheable(
    (request) => CacheKeyUtil.userKey(request.params.userId, 'posts'),
    300,
  )
  @Get(':userId/posts')
  async getUserPosts(@Param('userId') userId: string) {
    return this.fetchUserPostsFromDatabase(userId);
  }

  /**
   * 示例4：更新数据时清除相关缓存
   */
  @CacheEvict((request) => [
    CacheKeyUtil.userKey(request.params.userId, 'profile'),
    CacheKeyUtil.userKey(request.params.userId, 'settings'),
    CacheKeyUtil.userKey(request.params.userId, 'posts'),
  ])
  @Post(':userId/profile')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() profileData: unknown,
  ) {
    // 更新数据库
    const updatedProfile = await this.updateUserInDatabase(userId, profileData);

    // 缓存新的用户档案
    const cacheKey = CacheKeyUtil.userKey(userId, 'profile');
    await this.cacheService.set(cacheKey, updatedProfile, 600);

    return updatedProfile;
  }

  /**
   * 示例5：批量缓存操作
   */
  @Get('users/profiles')
  async getUsersProfiles(@Query('userIds') userIds: string[]) {
    // 生成缓存键
    const cacheKeys = userIds.map((id) => CacheKeyUtil.userKey(id, 'profile'));

    // 批量获取缓存
    const cachedProfiles = await this.cacheService.mget(cacheKeys);

    // 找出缓存中不存在的用户
    const missingUserIds: string[] = [];
    const results: unknown[] = [];

    cachedProfiles.forEach((profile, index) => {
      if (profile === undefined) {
        missingUserIds.push(userIds[index]);
      }
      results[index] = profile;
    });

    // 从数据库获取缺失的用户数据
    if (missingUserIds.length > 0) {
      const missingProfiles = await this.fetchUsersFromDatabase(missingUserIds);

      // 准备批量缓存数据
      const cacheItems = missingProfiles.map((profile, index) => ({
        key: CacheKeyUtil.userKey(missingUserIds[index], 'profile'),
        value: profile,
      }));

      // 批量设置缓存
      await this.cacheService.mset(cacheItems, 600);

      // 将结果合并到最终结果中
      missingUserIds.forEach((userId, index) => {
        const originalIndex = userIds.indexOf(userId);
        results[originalIndex] = missingProfiles[index];
      });
    }

    return results;
  }

  /**
   * 示例6：缓存统计数据
   */
  @Get('users/:userId/stats')
  async getUserStats(
    @Param('userId') userId: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly',
  ) {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = CacheKeyUtil.statsKey(`user:${userId}`, period, today);

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.calculateUserStats(userId, period),
      period === 'daily'
        ? 3600 // 1 小时
        : period === 'weekly'
          ? 7200 // 2 小时
          : 14400, // 4 小时（monthly）
    );
  }

  /**
   * 示例7：搜索结果缓存
   */
  @Get('users/search')
  async searchUsers(
    @Query('query') query: string,
    @Query('filters') filters?: Record<string, unknown>,
  ) {
    const cacheKey = CacheKeyUtil.searchKey(query, filters);

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.performUserSearch(query, filters),
      180, // 3 分钟缓存
    );
  }

  /**
   * 示例8：分页数据缓存
   */
  @Get('users/list')
  async getUserList(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('filters') filters?: Record<string, unknown>,
  ) {
    const cacheKey = CacheKeyUtil.paginationKey('users', page, limit, filters);

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.fetchPaginatedUsers(page, limit, filters),
      300, // 5 分钟缓存
    );
  }

  // 模拟数据库操作方法
  private async fetchUserFromDatabase(userId: string): Promise<unknown> {
    // 模拟数据库查询
    return {
      id: userId,
      name: 'User ' + userId,
      email: `user${userId}@example.com`,
    };
  }

  private async fetchUserSettingsFromDatabase(
    userId: string,
  ): Promise<unknown> {
    // 模拟数据库查询
    return { userId, theme: 'dark', language: 'zh-CN' };
  }

  private async fetchUserPostsFromDatabase(userId: string): Promise<unknown[]> {
    // 模拟数据库查询
    return [
      { id: 1, userId, title: 'Post 1', content: 'Content 1' },
      { id: 2, userId, title: 'Post 2', content: 'Content 2' },
    ];
  }

  private async updateUserInDatabase(
    userId: string,
    profileData: unknown,
  ): Promise<unknown> {
    // 模拟数据库更新
    return {
      id: userId,
      ...(profileData as Record<string, unknown>),
      updatedAt: new Date(),
    };
  }

  private async fetchUsersFromDatabase(
    userIds: string[],
  ): Promise<Record<string, unknown>[]> {
    // 模拟批量数据库查询
    return userIds.map((id) => ({
      id,
      name: 'User ' + id,
      email: `user${id}@example.com`,
    }));
  }

  private async calculateUserStats(
    userId: string,
    period: string,
  ): Promise<unknown> {
    // 模拟统计计算
    return {
      userId,
      period,
      posts: Math.floor(Math.random() * 100),
      likes: Math.floor(Math.random() * 500),
      views: Math.floor(Math.random() * 1000),
    };
  }

  private async performUserSearch(
    query: string,
    filters?: Record<string, unknown>,
  ): Promise<unknown[]> {
    // 模拟搜索操作
    return [
      { id: 1, name: `User matching ${query}`, relevance: 0.9 },
      { id: 2, name: `Another user for ${query}`, relevance: 0.7 },
    ];
  }

  private async fetchPaginatedUsers(
    page: number,
    limit: number,
    filters?: Record<string, unknown>,
  ): Promise<unknown> {
    // 模拟分页查询
    const total = 1000;
    const users = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      name: `User ${(page - 1) * limit + i + 1}`,
    }));

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
