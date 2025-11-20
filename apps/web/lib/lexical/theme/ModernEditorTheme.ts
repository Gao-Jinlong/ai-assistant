/**
 * Modern Lexical Editor Theme - 现代化编辑器主题配置
 * 使用语义化的类名，提供直观的样式系统
 */

import type { EditorThemeClasses } from 'lexical'

import './modern-editor.css'

/**
 * 现代化编辑器主题配置
 * 类名采用语义化命名，易于理解和维护
 */
const modernTheme: EditorThemeClasses = {
  // 自动完成
  autocomplete: 'editor-autocomplete',

  // 块级光标
  blockCursor: 'editor-block-cursor',

  // 字符限制
  characterLimit: 'editor-character-limit',

  // 代码样式
  code: 'editor-code-block',

  // 代码高亮
  codeHighlight: {
    atrule: 'editor-code-highlight-keyword',
    attr: 'editor-code-highlight-variable',
    boolean: 'editor-code-highlight-variable',
    builtin: 'editor-code-highlight-function',
    cdata: 'editor-code-highlight-comment',
    char: 'editor-code-highlight-string',
    class: 'editor-code-highlight-function',
    'class-name': 'editor-code-highlight-function',
    comment: 'editor-code-highlight-comment',
    constant: 'editor-code-highlight-variable',
    deleted: 'editor-code-highlight-strikethrough',
    doctype: 'editor-code-highlight-comment',
    entity: 'editor-code-highlight-operator',
    function: 'editor-code-highlight-function',
    important: 'editor-code-highlight-keyword',
    inserted: 'editor-code-highlight-string',
    keyword: 'editor-code-highlight-keyword',
    namespace: 'editor-code-highlight-variable',
    number: 'editor-code-highlight-number',
    operator: 'editor-code-highlight-operator',
    prolog: 'editor-code-highlight-comment',
    property: 'editor-code-highlight-variable',
    punctuation: 'editor-code-highlight-operator',
    regex: 'editor-code-highlight-function',
    selector: 'editor-code-highlight-function',
    string: 'editor-code-highlight-string',
    symbol: 'editor-code-highlight-variable',
    tag: 'editor-code-highlight-keyword',
    unchanged: 'editor-code-highlight-variable',
    url: 'editor-code-highlight-link',
    variable: 'editor-code-highlight-variable',
  },

  // 嵌入块
  embedBlock: {
    base: 'editor-embed-block',
    focus: 'editor-embed-block-focus',
  },

  // 标签（话题标签）
  hashtag: 'editor-hashtag',

  // 标题样式
  heading: {
    h1: 'editor-heading-1',
    h2: 'editor-heading-2',
    h3: 'editor-heading-3',
    h4: 'editor-heading-4',
    h5: 'editor-heading-5',
    h6: 'editor-heading-6',
  },

  // 水平分割线
  hr: 'editor-hr',
  hrSelected: 'editor-hr-selected',

  // 图片
  image: 'editor-image',

  // 缩进
  indent: 'editor-indent',

  // 布局容器
  layoutContainer: 'editor-layout-container',
  layoutItem: 'editor-layout-item',

  // 链接
  link: 'editor-link',

  // 列表样式
  list: {
    checklist: 'editor-list-checklist',
    listitem: 'editor-list-item',
    listitemChecked: 'editor-list-item-checked',
    listitemUnchecked: 'editor-list-item-unchecked',
    nested: {
      listitem: 'editor-list-nested',
    },
    olDepth: [
      'editor-list-ordered-1',
      'editor-list-ordered-2',
      'editor-list-ordered-3',
      'editor-list-ordered-4',
      'editor-list-ordered-5',
    ],
    ul: 'editor-list-unordered',
  },

  // 标记
  mark: 'editor-text-highlight',
  markOverlap: 'editor-text-highlight-overlap',

  // 段落
  paragraph: 'editor-paragraph',

  // 引用
  quote: 'editor-quote',

  // 特殊文本
  specialText: 'editor-special-text',

  // Tab 节点
  tab: 'editor-tab-node',

  // 表格样式
  table: 'editor-table',
  tableAddColumns: 'editor-table-add-columns',
  tableAddRows: 'editor-table-add-rows',
  tableAlignment: {
    center: 'editor-table-align-center',
    right: 'editor-table-align-right',
  },
  tableCell: 'editor-table-cell',
  tableCellActionButton: 'editor-table-cell-action-button',
  tableCellActionButtonContainer: 'editor-table-cell-action-container',
  tableCellHeader: 'editor-table-cell-header',
  tableCellResizer: 'editor-table-cell-resizer',
  tableCellSelected: 'editor-table-cell-selected',
  tableFrozenColumn: 'editor-table-frozen-column',
  tableFrozenRow: 'editor-table-frozen-row',
  tableRowStriping: 'editor-table-row-striping',
  tableScrollableWrapper: 'editor-table-wrapper',
  tableSelected: 'editor-table-selected',
  tableSelection: 'editor-table-selection',

  // 文本格式样式
  text: {
    bold: 'editor-text-bold',
    capitalize: 'editor-text-capitalize',
    code: 'editor-text-code',
    highlight: 'editor-text-highlight',
    italic: 'editor-text-italic',
    lowercase: 'editor-text-lowercase',
    strikethrough: 'editor-text-strikethrough',
    subscript: 'editor-text-subscript',
    superscript: 'editor-text-superscript',
    underline: 'editor-text-underline',
    underlineStrikethrough: 'editor-text-underline-strikethrough',
    uppercase: 'editor-text-uppercase',
  },
}

export default modernTheme
