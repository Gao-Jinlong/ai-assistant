import { cn } from '@web/lib/utils';
import { MessageChunkDto } from '@web/service/thread';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { cva } from 'class-variance-authority';
import { memo, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';

export interface MessageItemProps {
  message: MessageChunkDto;
}

const messageItemVariants = cva('flex gap-2', {
  variants: {
    role: {
      user: 'justify-end',
      assistant: 'text-left',
    },
  },
  defaultVariants: {
    role: 'user',
  },
});

function SetMessage({ message }: MessageItemProps) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const content = message?.data?.content ?? '';
      const md = new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
      }).use(markdownItKatex, {
        // 启用行内和块级数学公式
        throwOnError: false,
        errorColor: '#cc0000',
      });
      const html = md.render(content);

      // 开发模式下打印渲染结果以便调试
      if (process.env.NODE_ENV === 'development') {
        console.log('Markdown content:', content);
        console.log('Rendered HTML:', html);
      }

      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      root.append(...nodes);
    });
  }, [editor, message]);
  return null;
}

const MessageItem = ({ message }: MessageItemProps) => {
  const initialConfig = {
    namespace: 'MyEditor',
    onError: (error: Error) => {
      console.error(error);
    },
    // 注册支持 Markdown 渲染的节点
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
  };

  return (
    <div className={messageItemVariants({ role: message.role })}>
      <div
        className={cn(
          'w-auto max-w-[min(80ch,90vw)] rounded-md p-4',
          message.role === 'user' ? 'bg-secondary' : 'justify-start text-left',
        )}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                readOnly={true}
                className="prose prose-sm dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded dark:prose-pre:bg-gray-800 max-w-none focus:outline-none"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <SetMessage message={message} />
        </LexicalComposer>
      </div>
    </div>
  );
};

export default memo(MessageItem);
