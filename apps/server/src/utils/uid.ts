import { nanoid } from 'nanoid';

export function generateUid(prefix?: string) {
  return `${prefix ? `${prefix}-` : ''}${nanoid()}`;
}
