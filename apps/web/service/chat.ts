import { sseUtils } from '@web/utils';
import { sse } from './fetch';
import { Options } from 'ky';

export interface StartChatRequest {
  threadUid: string;
  message: string;
}

export async function* startChat(data: StartChatRequest, options?: Options) {
  const response = await sse(`chat`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Reader is null');
  }

  const decoder = new TextDecoder('utf-8');

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      const data = decoder.decode(value, { stream: true });

      const lines = data.split('\n');
      for (const line of lines) {
        const data = sseUtils.parseSSEMessage(line);
        if (data) {
          yield data;
        }
      }
    }
  } finally {
    reader?.releaseLock();
  }
}
