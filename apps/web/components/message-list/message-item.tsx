import { cn } from '@web/lib/utils';
import { cva } from 'class-variance-authority';
import { memo, useEffect, useMemo } from 'react';
import { MESSAGE_ROLE, type MESSAGE_TYPE } from '@server/chat/chat.interface';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';

import { $getRoot, configExtension, defineExtension } from 'lexical';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextExtension } from '@lexical/rich-text';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '@lexical/markdown';
import {
  AutoFocusExtension,
  HorizontalRuleExtension,
} from '@lexical/extension';
import { ReactExtension } from '@lexical/react/ReactExtension';

import MarkdownExtension from '@web/lib/lexical/extensions/MarkdownExtension';
import { EquationNode } from '@web/lib/lexical/nodes/EquationNode';
import { PLAYGROUND_TRANSFORMERS } from '@web/lib/lexical/plugin/MarkdownTransformers';

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
  // TODO 通过 lexical 内置 command CONTROL_TEXT_INSERTION 来增量更新文本，参考 ContentEditable
  const content = message.data.content ?? '';

  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.update(() => {
      // 清空编辑器
      const root = $getRoot();
      root.clear();

      // 先用默认转换器处理 Markdown
      $convertFromMarkdownString(content, PLAYGROUND_TRANSFORMERS);
    });
  }, [editor, content]);
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
