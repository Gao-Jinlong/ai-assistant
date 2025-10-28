import { uuid } from '@/utils';
import { describe, it, expect } from 'vitest';

// 直接测试简单函数而不导入
describe('generateUid Test', () => {
  it('should generate uid', () => {
    const uid = uuid.generateUid();
    expect(uid).toBeDefined();
    expect(typeof uid).toBe('string');
    expect(uid.length).toBe(21);
  });
  it('should generate uid with prefix', () => {
    const prefix = 'test';
    const uid = uuid.generateUid(prefix);
    expect(uid).toBeDefined();
    expect(typeof uid).toBe('string');
    expect(uid.length).toBe(prefix.length + 1 + 21);
    expect(uid.startsWith(`${prefix}-`)).toBe(true);
  });
  it('should generate message id', () => {
    const prefix = 'm';
    const messageId = uuid.generateUid();
    expect(messageId).toBeDefined();
    expect(typeof messageId).toBe('string');
    expect(messageId.length).toBe(prefix.length + 1 + 21);
    expect(messageId.startsWith('m-')).toBe(true);
  });
  it('should generate thread id', () => {
    const prefix = 't';
    const threadId = uuid.generateThreadId();
    expect(threadId).toBeDefined();
    expect(typeof threadId).toBe('string');
    expect(threadId.length).toBe(prefix.length + 1 + 21);
    expect(threadId.startsWith('t-')).toBe(true);
  });
});
