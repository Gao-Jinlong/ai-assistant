import { cn } from '@web/lib/utils';
import { cva } from 'class-variance-authority';
import { memo, useEffect, useMemo, useRef } from 'react';
import { MESSAGE_ROLE, type MESSAGE_TYPE } from '@server/chat/chat.interface';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';

import { $getRoot, configExtension, defineExtension } from 'lexical';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextExtension } from '@lexical/rich-text';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { HorizontalRuleExtension } from '@lexical/extension';
import { ReactExtension } from '@lexical/react/ReactExtension';

import MarkdownExtension from '@web/lib/lexical/extensions/MarkdownExtension';
import { EquationNode } from '@web/lib/lexical/nodes/EquationNode';
import { PLAYGROUND_TRANSFORMERS } from '@web/lib/lexical/plugin/MarkdownTransformers';
import IncrementUpdateExtension, {
  INCREMENT_UPDATE_COMMAND,
} from '@web/lib/lexical/extensions/IncrementUpdateExtension';

export interface MessageItemProps {
  message: StreamMessage & { type: MESSAGE_TYPE.MESSAGE_CHUNK };
}

// TODO 重构公式渲染逻辑
const messageItemVariants = cva('flex gap-2', {
  variants: {
    role: {
      [MESSAGE_ROLE.HUMAN]: 'justify-end',
      [MESSAGE_ROLE.ASSISTANT]: 'text-left',
    },
  },
  defaultVariants: {
    role: MESSAGE_ROLE.HUMAN,
  },
});

function SetMessage({ message }: MessageItemProps) {
  const [editor] = useLexicalComposerContext();
  const messageRef = useRef<number>(0);

  const incrementMessage = useMemo(() => {
    return message.data.content?.slice(messageRef.current) ?? '';
  }, [message.data.content]);

  if (incrementMessage.length > 0) {
    editor.dispatchCommand(INCREMENT_UPDATE_COMMAND, incrementMessage);
    messageRef.current = message.data.content?.length ?? 0;
  }

  return null;
}

/**
 * TODO
 * 修改 message 更新方式，通过追加文本的方式更新，而不是全量更新
 */
const MessageItem = ({ message }: MessageItemProps) => {
  const extension = useMemo(() => {
    return defineExtension({
      name: 'LexicalEditor',
      namespace: 'LexicalEditor',
      dependencies: [
        RichTextExtension,
        HorizontalRuleExtension,
        IncrementUpdateExtension,
        configExtension(MarkdownExtension, {
          nodes: () => [EquationNode],
          transformers: PLAYGROUND_TRANSFORMERS,
        }),
        configExtension(ReactExtension, {
          contentEditable: <ContentEditable className="editor-content" />,
        }),
      ],
    });
  }, []);

  return (
    <div className={messageItemVariants({ role: message.data.role })}>
      <div
        className={cn(
          'w-auto max-w-[min(80ch,90vw)] rounded-md p-4',
          message.data.role === MESSAGE_ROLE.HUMAN
            ? 'bg-secondary'
            : 'justify-start text-left',
        )}
      >
        <LexicalExtensionComposer extension={extension}>
          <SetMessage message={message} />
        </LexicalExtensionComposer>
      </div>
    </div>
  );
};

export default memo(MessageItem);
