import {
  AIMessageChunk,
  type BaseMessage,
  type BaseMessageChunk,
} from '@langchain/core/messages';
import type { MESSAGE_ROLE } from '@server/interface';

export async function* streamMessageOutputToGenerator(
  streamMessageOutput: AsyncIterable<[BaseMessage, Record<string, unknown>]>,
) {
  for await (const [message, _metadata] of streamMessageOutput) {
    yield new AIMessageChunk(message.content.toString());
  }
}

export function parseSSEMessage(message: `data: ${string}`): unknown {
  if (!message.startsWith('data:')) {
    return null;
  }

  const data = message.split('data:')[1];
  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

export function formatDataToSSE(data: unknown) {
  return `data:${JSON.stringify(data)}\n\n`;
}
