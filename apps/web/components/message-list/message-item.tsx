import { cn } from '@web/lib/utils';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { cva } from 'class-variance-authority';
import { memo, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $convertFromMarkdownString } from '@lexical/markdown';
import EquationsPlugin from '@web/lib/lexical/EquationsPlugin';
import { EquationNode } from '@web/lib/lexical/nodes/EquationNode';
import { $getRoot } from 'lexical';
import 'katex/dist/katex.css';
import { PLAYGROUND_TRANSFORMERS } from '@web/lib/lexical/plugin/MarkdownTransformers';
import { MESSAGE_ROLE, type MESSAGE_TYPE } from '@server/chat/chat.interface';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';

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
  const content = message.data.content;

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

const MessageItem = ({ message }: MessageItemProps) => {
  const initialConfig = {
    namespace: 'MyEditor',
    editable: false, // 禁用编辑功能
    onError: (error: Error) => {
      console.error(error);
    },
    // 注册支持 Markdown 渲染的节点
    nodes: [
      HorizontalRuleNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      EquationNode,
    ],
  };

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
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                readOnly={true}
                className="prose prose-sm dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded dark:prose-pre:bg-gray-800 max-w-none cursor-default focus:outline-none [&_div.editor-equation]:mx-0 [&_div.editor-equation]:my-3 [&_div.editor-equation]:block [&_div.editor-equation]:text-center [&_span.editor-equation]:mx-0.5 [&_span.editor-equation]:inline [&_span.editor-equation]:align-baseline"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <EquationsPlugin />
          <SetMessage message={message} />
        </LexicalComposer>
      </div>
    </div>
  );
};

export default memo(MessageItem);
