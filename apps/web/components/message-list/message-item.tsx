import { cn } from '@web/lib/utils';
import { MessageChunkDto } from '@web/service/thread';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { cva } from 'class-variance-authority';
import { memo, useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import EquationsPlugin from '@web/lib/lexical/EquationsPlugin';
import {
  EquationNode,
  $createEquationNode,
} from '@web/lib/lexical/nodes/EquationNode';
import { $getRoot, $createTextNode, $createParagraphNode } from 'lexical';
import 'katex/dist/katex.css';

export interface MessageItemProps {
  message: MessageChunkDto;
}

// TODO 重构公式渲染逻辑
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
  const content = message.data.content;

  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(content, TRANSFORMERS);

      // // 清空编辑器
      // const root = $getRoot();
      // root.clear();
      // // 使用更简单的方法：先处理Markdown，然后处理数学公式
      // let content = message.data.content;
      // // 找到所有数学公式并创建临时的标记
      // const mathExpressions: Array<{
      //   match: string;
      //   equation: string;
      //   inline: boolean;
      //   id: string;
      // }> = [];
      // let idCounter = 0;
      // // 处理块级公式
      // content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, equation) => {
      //   const id = `TEMP_MATH_BLOCK_${idCounter++}`;
      //   mathExpressions.push({
      //     match: id,
      //     equation: equation.trim(),
      //     inline: false,
      //     id,
      //   });
      //   return `\n${id}\n`; // 块级公式前后用换行，确保独立段落
      // });
      // // 处理行内公式
      // content = content.replace(/\$([^$\n]+?)\$/g, (match, equation) => {
      //   const id = `TEMP_MATH_INLINE_${idCounter++}`;
      //   mathExpressions.push({
      //     match: id,
      //     equation: equation.trim(),
      //     inline: true,
      //     id,
      //   });
      //   return id; // 行内公式不加空格，保持在同一行
      // });
      // // 先用默认转换器处理 Markdown
      // $convertFromMarkdownString(content, TRANSFORMERS);
      // // 然后找到并替换所有的数学公式标记
      // mathExpressions.forEach(({ id, equation, inline }) => {
      //   let replaced = false;
      //   let attempts = 0;
      //   const maxAttempts = 5;
      //   // 重复查找直到找到或达到最大尝试次数
      //   while (!replaced && attempts < maxAttempts) {
      //     attempts++;
      //     const textNodes = root.getAllTextNodes();
      //     for (const textNode of textNodes) {
      //       const textContent = textNode.getTextContent();
      //       const idIndex = textContent.indexOf(id);
      //       if (idIndex !== -1) {
      //         const before = textContent.substring(0, idIndex);
      //         const after = textContent.substring(idIndex + id.length);
      //         const equationNode = $createEquationNode(equation, inline);
      //         if (before && after) {
      //           // 情况1: 中间有公式 "text FORMULA text"
      //           textNode.setTextContent(before);
      //           const afterNode = $createTextNode(after);
      //           textNode.insertAfter(equationNode);
      //           equationNode.insertAfter(afterNode);
      //         } else if (before) {
      //           // 情况2: 公式在末尾 "text FORMULA"
      //           textNode.setTextContent(before);
      //           textNode.insertAfter(equationNode);
      //         } else if (after) {
      //           // 情况3: 公式在开头 "FORMULA text"
      //           const afterNode = $createTextNode(after);
      //           textNode.replace(equationNode);
      //           equationNode.insertAfter(afterNode);
      //         } else {
      //           // 情况4: 整个节点就是公式 "FORMULA"
      //           textNode.replace(equationNode);
      //         }
      //         replaced = true;
      //         break;
      //       }
      //     }
      //   }
      // });
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
