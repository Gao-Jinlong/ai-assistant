import { MESSAGE_TYPE } from '@server/chat/chat.interface';
import {
  AIMessageChunk,
  BaseMessage,
  isAIMessageChunk,
} from '@langchain/core/messages';

export function formatMessageChunk(chunk: AIMessageChunk) {
  const { content, tool_call_chunks, id, ..._rest } = chunk;
  if (tool_call_chunks?.length) {
    return {
      type: MESSAGE_TYPE.TOOL_CALL_CHUNK,
      id,
      data: tool_call_chunks[0].args,
    };
  } else {
    return {
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
      data: {
        id,
        data: content,
      },
    };
  }
}

export function formatMessage(message: BaseMessage) {
  if (isAIMessageChunk(message as AIMessageChunk)) {
    return formatMessageChunk(message as AIMessageChunk);
  } else {
    return message;
  }
}
