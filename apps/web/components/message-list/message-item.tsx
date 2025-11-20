import { cn } from '@web/lib/utils';
import { cva } from 'class-variance-authority';
import { memo, useEffect, useMemo, useRef } from 'react';
import { MESSAGE_ROLE, MESSAGE_TYPE } from '@server/chat/chat.interface';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';

import { $getRoot, configExtension, defineExtension } from 'lexical';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextExtension } from '@lexical/rich-text';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HorizontalRuleExtension } from '@lexical/extension';
import { ReactExtension } from '@lexical/react/ReactExtension';

import MarkdownExtension from '@web/lib/lexical/extensions/MarkdownExtension';
import { EquationNode } from '@web/lib/lexical/nodes/EquationNode';
import { PLAYGROUND_TRANSFORMERS } from '@web/lib/lexical/plugin/MarkdownTransformers';
import IncrementUpdateExtension from '@web/lib/lexical/extensions/IncrementUpdateExtension';
import useBoundStore from '@web/store';
import { $convertFromMarkdownString } from '@lexical/markdown';
import modernTheme from '@web/lib/lexical/theme/ModernEditorTheme';

export interface MessageItemProps {
  messageId: StreamMessage['id'];
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

function FullUpdateMessage({ messageId }: MessageItemProps) {
  const [editor] = useLexicalComposerContext();
  const message = useBoundStore((state) => state.messages.get(messageId));

  useEffect(() => {
    if (message && message.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(
          message.data?.content ?? '',
          PLAYGROUND_TRANSFORMERS,
        );
      });
    }
  }, [message]);

  return null;
}

/**
 * TODO
 * 修改 message 更新方式，通过追加文本的方式更新，而不是全量更新
 */
const MessageItem = ({ messageId }: MessageItemProps) => {
  const message = useBoundStore((state) =>
    state.messages.get(messageId),
  ) as StreamMessage & { type: MESSAGE_TYPE.MESSAGE_CHUNK };

  const extension = useMemo(() => {
    return defineExtension({
      name: 'LexicalEditor',
      namespace: 'LexicalEditor',
      editable: false,
      dependencies: [
        RichTextExtension,
        HorizontalRuleExtension,
        IncrementUpdateExtension,
        configExtension(ReactExtension, {}),
        configExtension(MarkdownExtension, {
          nodes: () => [EquationNode],
          transformers: PLAYGROUND_TRANSFORMERS,
        }),
      ],
      theme: modernTheme,
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
          {/* <SetMessage messageId={messageId} /> */}
          <FullUpdateMessage messageId={messageId} />
        </LexicalExtensionComposer>
      </div>
    </div>
  );
};

export default memo(MessageItem);
