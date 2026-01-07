import { sseUtils } from '@web/utils';
import { sse } from './fetch';
import { MESSAGE_ROLE } from '@common/constants';
import type { MessageChunkData } from '@server/chat/dto/sse-message.dto';

// export interface StartChatRequest {
//   threadUid: string;
//   message: string;
// }

// export async function* startChat(data: StartChatRequest, options?: Options) {
//   const response = await sse(`chat`, {
//     method: 'POST',
//     body: JSON.stringify(data),
//     ...options,
//   });

//   const reader = response.body?.getReader();

//   if (!reader) {
//     throw new Error('Reader is null');
//   }

//   const decoder = new TextDecoder('utf-8');

//   try {
//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) {
//         break;
//       }
//       const data = decoder.decode(value, { stream: true });

//       const lines = data.split('\n');
//       for (const line of lines) {
//         const data = sseUtils.parseSSEMessage(line);
//         if (data) {
//           yield data;
//         }
//       }
//     }
//   } finally {
//     reader?.releaseLock();
//   }
// }

/**
 * 聊天流参数
 *
 * 后续可以扩展其他聊天配置项，如：
 * - 是否开启深度思考
 * - mcp
 * - 工具
 * - ...
 */
export interface ChatStreamParams {
  threadId: string;
}
export interface Message extends MessageChunkData {
  contentChunks: string[];
}
export async function* chatStream(
  content: string,
  params: ChatStreamParams,
  options: { signal?: AbortController } = {},
) {
  const response = await sse(`chat`, {
    method: 'POST',
    body: JSON.stringify({ role: MESSAGE_ROLE.HUMAN, content, ...params }),
    signal: options.signal?.signal,
  });

  const reader = response.body
    ?.pipeThrough(new TextDecoderStream())
    .getReader();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    let buffer = '';
    // Use configurable buffer size from environment, default to 1MB (1048576 bytes)
    const MAX_BUFFER_SIZE = 2 ** 20;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Handle remaining buffer data
        if (buffer.trim()) {
          const event = sseUtils.parseSSEMessage(buffer.trim());
          if (event) {
            yield event;
          }
        }
        break;
      }

      buffer += value;

      // Check buffer size to avoid memory overflow
      if (buffer.length > MAX_BUFFER_SIZE) {
        throw new Error(
          `Buffer overflow - received ${(buffer.length / 1024 / 1024).toFixed(2)}MB of data without proper event boundaries. ` +
            `Max buffer size is ${(MAX_BUFFER_SIZE / 1024 / 1024).toFixed(2)}MB. ` +
            `You can increase this by setting NEXT_PUBLIC_MAX_STREAM_BUFFER_SIZE environment variable.`,
        );
      }

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);

        if (chunk.trim()) {
          const event = sseUtils.parseSSEMessage(chunk);
          if (event) {
            yield event;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function restoreChat(threadId: string) {
  const response = await sse(`chat/threads/restore`, {
    method: 'GET',
    params: { threadId },
  });
  return response.data;
}

/**
 * 恢复正在进行中的对话的消息流
 * @param threadId - 线程 ID
 * @param options - 可选配置，包含 signal 用于取消请求
 * @returns 异步生成器，产生流式消息
 */
export async function* restoreChatStream(
  threadId: string,
  options: { signal?: AbortController } = {},
) {
  const response = await sse(`chat/restore`, {
    method: 'POST',
    body: JSON.stringify({ threadId }),
    signal: options.signal?.signal,
  });

  const reader = response.body
    ?.pipeThrough(new TextDecoderStream())
    .getReader();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    let buffer = '';
    // Use configurable buffer size from environment, default to 1MB (1048576 bytes)
    const MAX_BUFFER_SIZE = 2 ** 20;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Handle remaining buffer data
        if (buffer.trim()) {
          const event = sseUtils.parseSSEMessage(buffer.trim());
          if (event) {
            yield event;
          }
        }
        break;
      }

      buffer += value;

      // Check buffer size to avoid memory overflow
      if (buffer.length > MAX_BUFFER_SIZE) {
        throw new Error(
          `Buffer overflow - received ${(buffer.length / 1024 / 1024).toFixed(2)}MB of data without proper event boundaries. ` +
            `Max buffer size is ${(MAX_BUFFER_SIZE / 1024 / 1024).toFixed(2)}MB. ` +
            `You can increase this by setting NEXT_PUBLIC_MAX_STREAM_BUFFER_SIZE environment variable.`,
        );
      }

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);

        if (chunk.trim()) {
          const event = sseUtils.parseSSEMessage(chunk);
          if (event) {
            yield event;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
