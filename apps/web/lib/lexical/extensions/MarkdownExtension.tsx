import {
  defineExtension,
  LexicalNodeConfig,
  ParagraphNode,
  safeCast,
  TextNode,
} from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import {
  registerMarkdownShortcuts,
  TRANSFORMERS,
  type Transformer,
} from '@lexical/markdown';
import {
  HorizontalRuleExtension,
  HorizontalRuleNode,
} from '@lexical/extension';

interface MarkdownExtensionConfig {
  nodes?: () => readonly LexicalNodeConfig[] | LexicalNodeConfig[];
  transformers?: readonly Transformer[];
}

const MarkdownExtension = defineExtension({
  name: 'MarkdownExtension',
  namespace: 'MarkdownExtension',
  dependencies: [HorizontalRuleExtension],
  nodes: () => [
    ParagraphNode,
    TextNode,
    HeadingNode,
    LinkNode,
    AutoLinkNode,
    ListNode,
    QuoteNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    TableCellNode,
    TableNode,
    TableRowNode,
    HorizontalRuleNode,
  ],
  init(editorConfig, config) {
    const nodes = [];
    if (typeof editorConfig.nodes === 'function') {
      nodes.push(...(editorConfig.nodes() ?? []));
    } else {
      nodes.push(...(editorConfig.nodes ?? []));
    }
    if (typeof config.nodes === 'function') {
      nodes.push(...(config.nodes() ?? []));
    }
    editorConfig.nodes = nodes;
  },
  config: safeCast<MarkdownExtensionConfig>({
    nodes: () => [] as readonly LexicalNodeConfig[],
    transformers: TRANSFORMERS,
  }),
  afterRegistration: (editor, config) => {
    return registerMarkdownShortcuts(editor, [...(config.transformers ?? [])]);
  },
});

export default MarkdownExtension;
