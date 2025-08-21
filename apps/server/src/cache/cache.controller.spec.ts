import { Test, TestingModule } from '@nestjs/testing';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

describe('CacheController', () => {
  let controller: CacheController;
  let cacheService: CacheService;

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      has: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      mdel: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CacheController],
      providers: [
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    controller = module.get<CacheController>(CacheController);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get', () => {
    it('should return cache value', async () => {
      const key = 'test-key';
      const value = 'test-value';
      jest.spyOn(cacheService, 'get').mockResolvedValue(value);

      const result = await controller.get(key);

      expect(result).toEqual({
        key,
        value,
        exists: true,
      });
    });

    it('should return undefined for non-existent key', async () => {
      const key = 'test-key';
      jest.spyOn(cacheService, 'get').mockResolvedValue(undefined);

      const result = await controller.get(key);

      expect(result).toEqual({
        key,
        value: undefined,
        exists: false,
      });
    });
  });

  describe('set', () => {
    it('should set cache value', async () => {
      const dto = {
        key: 'test-key',
        value: 'test-value',
        ttl: 300,
      };
      jest.spyOn(cacheService, 'set').mockResolvedValue();

      const result = await controller.set(dto);

      expect(cacheService.set).toHaveBeenCalledWith(
        dto.key,
        dto.value,
        dto.ttl,
      );
      expect(result).toEqual({
        message: `Cache set for key: ${dto.key}`,
        key: dto.key,
      });
    });
  });

  describe('delete', () => {
    it('should delete cache value', async () => {
      const key = 'test-key';
      jest.spyOn(cacheService, 'del').mockResolvedValue();

      const result = await controller.delete(key);

      expect(cacheService.del).toHaveBeenCalledWith(key);
      expect(result).toEqual({
        message: `Cache deleted for key: ${key}`,
        key,
      });
    });
  });

  describe('exists', () => {
    it('should check if cache exists', async () => {
      const key = 'test-key';
      jest.spyOn(cacheService, 'has').mockResolvedValue(true);

      const result = await controller.exists(key);

      expect(result).toEqual({
        key,
        exists: true,
      });
    });
  });

  describe('getMultiple', () => {
    it('should get multiple cache values', async () => {
      const keys = 'key1,key2,key3';
      const values = ['value1', 'value2', undefined];
      jest.spyOn(cacheService, 'mget').mockResolvedValue(values);

      const result = await controller.getMultiple(keys);

      expect(cacheService.mget).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
      expect(result).toEqual([
        { key: 'key1', value: 'value1', exists: true },
        { key: 'key2', value: 'value2', exists: true },
        { key: 'key3', value: undefined, exists: false },
      ]);
    });
  });

  describe('setMultiple', () => {
    it('should set multiple cache values', async () => {
      const dto = {
        items: [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2' },
        ],
        ttl: 300,
      };
      jest.spyOn(cacheService, 'mset').mockResolvedValue();

      const result = await controller.setMultiple(dto);

      expect(cacheService.mset).toHaveBeenCalledWith(dto.items, dto.ttl);
      expect(result).toEqual({
        message: `Batch cache set for ${dto.items.length} items`,
        keys: ['key1', 'key2'],
      });
    });
  });

  describe('deleteMultiple', () => {
    it('should delete multiple cache values', async () => {
      const keys = 'key1,key2,key3';
      jest.spyOn(cacheService, 'mdel').mockResolvedValue();

      const result = await controller.deleteMultiple(keys);

      expect(cacheService.mdel).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
      expect(result).toEqual({
        message: `Batch cache deleted for 3 items`,
        keys: ['key1', 'key2', 'key3'],
      });
    });
  });

  describe('reset', () => {
    it('should reset all cache', async () => {
      jest.spyOn(cacheService, 'reset').mockResolvedValue();

      const result = await controller.reset();

      expect(cacheService.reset).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'All cache cleared',
      });
    });
  });
});
