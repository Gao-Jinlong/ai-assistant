import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value', async () => {
      const key = 'test-key';
      const value = 'test-value';
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it('should return undefined when cache fails', async () => {
      const key = 'test-key';
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get(key);

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set cache value', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 300;

      await service.set(key, value, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should handle set errors gracefully', async () => {
      const key = 'test-key';
      const value = 'test-value';
      cacheManager.set.mockRejectedValue(new Error('Set error'));

      await expect(service.set(key, value)).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete cache value', async () => {
      const key = 'test-key';

      await service.del(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should handle delete errors gracefully', async () => {
      const key = 'test-key';
      cacheManager.del.mockRejectedValue(new Error('Delete error'));

      await expect(service.del(key)).resolves.not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true when value exists', async () => {
      const key = 'test-key';
      cacheManager.get.mockResolvedValue('some-value');

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    it('should return false when value does not exist', async () => {
      const key = 'test-key';
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.has(key);

      expect(result).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      const factory = jest.fn().mockResolvedValue('new-value');
      
      cacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.getOrSet(key, factory);

      expect(result).toBe(cachedValue);
      expect(factory).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should call factory and set cache if value does not exist', async () => {
      const key = 'test-key';
      const newValue = 'new-value';
      const factory = jest.fn().mockResolvedValue(newValue);
      const ttl = 300;
      
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.getOrSet(key, factory, ttl);

      expect(result).toBe(newValue);
      expect(factory).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(key, newValue, ttl);
    });

    it('should return factory result even if cache operations fail', async () => {
      const key = 'test-key';
      const newValue = 'new-value';
      const factory = jest.fn().mockResolvedValue(newValue);
      
      cacheManager.get.mockRejectedValue(new Error('Get error'));

      const result = await service.getOrSet(key, factory);

      expect(result).toBe(newValue);
      expect(factory).toHaveBeenCalled();
    });
  });

  describe('mget', () => {
    it('should return array of values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', undefined];
      
      cacheManager.get
        .mockResolvedValueOnce(values[0])
        .mockResolvedValueOnce(values[1])
        .mockResolvedValueOnce(values[2]);

      const result = await service.mget(keys);

      expect(result).toEqual(values);
      expect(cacheManager.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('mset', () => {
    it('should set multiple cache values', async () => {
      const items = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];
      const ttl = 300;

      await service.mset(items, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith('key1', 'value1', ttl);
      expect(cacheManager.set).toHaveBeenCalledWith('key2', 'value2', ttl);
    });
  });

  describe('mdel', () => {
    it('should delete multiple cache values', async () => {
      const keys = ['key1', 'key2'];

      await service.mdel(keys);

      expect(cacheManager.del).toHaveBeenCalledWith('key1');
      expect(cacheManager.del).toHaveBeenCalledWith('key2');
    });
  });
});