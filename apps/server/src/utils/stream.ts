import { AIMessageChunk, type BaseMessage } from '@langchain/core/messages';

export async function* streamChunkParser(
  stream: AsyncIterable<
    ['messages', [BaseMessage, Record<string, unknown>]] | ['custom', unknown]
  >,
) {
  for await (const item of stream) {
    const [type, payload] = item;
    switch (type) {
      case 'messages':
        yield* messagesParser(payload);
        break;
      case 'custom':
        yield* customParser(payload);
        break;
      default: {
        const _exhaustiveCheck: never = type;
        throw new Error(`Unexpected type: ${_exhaustiveCheck}`);
      }
    }
  }
}

async function* messagesParser(
  streamOutput: [BaseMessage, Record<string, unknown>],
) {
  const [message, metadata] = streamOutput;
  yield new AIMessageChunk({
    content: message.content.toString(),
    response_metadata: metadata,
  });
}
async function* customParser(payload: unknown) {
  yield payload;
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
