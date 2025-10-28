import { nanoid as uuidUtils } from 'nanoid';

/**
 * 生成唯一ID
 * @param prefix - 前缀
 * @returns
 */
export function generateUid(prefix?: string) {
  return `${prefix ? `${prefix}-` : ''}${uuidUtils()}`;
}

/**
 * 生成消息ID
 */
export function generateMessageId() {
  return generateUid('m');
}

/**
 * 生成线程ID
 */
export function generateThreadId() {
  return generateUid('t');
}
