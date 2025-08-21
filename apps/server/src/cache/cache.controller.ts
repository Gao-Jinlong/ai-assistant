import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CacheService } from './cache.service';
import { Public } from '../auth/public.decorator';

interface SetCacheDto {
  key: string;
  value: any;
  ttl?: number;
}

interface SetMultipleCacheDto {
  items: Array<{ key: string; value: any }>;
  ttl?: number;
}

/**
 * 缓存管理控制器
 * 提供缓存的 CRUD 操作接口
 */
@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * 获取缓存值
   */
  @Get(':key')
  @Public()
  async get(@Param('key') key: string) {
    const value = await this.cacheService.get(key);
    return {
      key,
      value,
      exists: value !== undefined,
    };
  }

  /**
   * 设置缓存值
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async set(@Body() dto: SetCacheDto) {
    await this.cacheService.set(dto.key, dto.value, dto.ttl);
    return {
      message: `Cache set for key: ${dto.key}`,
      key: dto.key,
    };
  }

  /**
   * 删除缓存
   */
  @Delete(':key')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('key') key: string) {
    await this.cacheService.del(key);
    return {
      message: `Cache deleted for key: ${key}`,
      key,
    };
  }

  /**
   * 检查缓存是否存在
   */
  @Get(':key/exists')
  @Public()
  async exists(@Param('key') key: string) {
    const exists = await this.cacheService.has(key);
    return {
      key,
      exists,
    };
  }

  /**
   * 批量获取缓存
   */
  @Get()
  @Public()
  async getMultiple(@Query('keys') keys: string) {
    const keyArray = keys.split(',').map(k => k.trim());
    const values = await this.cacheService.mget(keyArray);
    
    return keyArray.map((key, index) => ({
      key,
      value: values[index],
      exists: values[index] !== undefined,
    }));
  }

  /**
   * 批量设置缓存
   */
  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async setMultiple(@Body() dto: SetMultipleCacheDto) {
    await this.cacheService.mset(dto.items, dto.ttl);
    return {
      message: `Batch cache set for ${dto.items.length} items`,
      keys: dto.items.map(item => item.key),
    };
  }

  /**
   * 批量删除缓存
   */
  @Delete()
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMultiple(@Query('keys') keys: string) {
    const keyArray = keys.split(',').map(k => k.trim());
    await this.cacheService.mdel(keyArray);
    return {
      message: `Batch cache deleted for ${keyArray.length} items`,
      keys: keyArray,
    };
  }

  /**
   * 重置所有缓存
   */
  @Delete('reset/all')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async reset() {
    await this.cacheService.reset();
    return {
      message: 'All cache cleared',
    };
  }
}