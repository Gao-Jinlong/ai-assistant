import { MESSAGE_TYPE, type MESSAGE_ROLE } from '@server/chat/chat.interface';
import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { nanoid } from 'nanoid';

export function formatMessageChunk(
  chunk: AIMessageChunk,
  groupId: string,
  role: MESSAGE_ROLE,
) {
  const { content, tool_call_chunks, ..._rest } = chunk;
  /**
   * 本条消息 id
   */
  const id = nanoid();

  if (tool_call_chunks?.length) {
    return {
      type: MESSAGE_TYPE.TOOL_CALL_CHUNK,
      id,
      groupId,
      role,
      data: {
        args: tool_call_chunks[0].args,
      },
    };
  } else {
    return {
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
      id,
      groupId,
      role,
      data: {
        content,
      },
    };
  }
}

export function formatMessage(
  message: BaseMessage,
  groupId: string,
  role: MESSAGE_ROLE,
) {
  if (AIMessageChunk.isInstance(message as AIMessageChunk)) {
    return formatMessageChunk(message as AIMessageChunk, groupId, role);
  } else {
    return message;
  }
}
