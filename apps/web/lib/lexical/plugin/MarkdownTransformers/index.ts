/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  MultilineElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown';
import { LexicalNode } from 'lexical';

import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from '../../nodes/EquationNode';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/extension';

export const HR: ElementTransformer = {
  dependencies: [],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

// export const EQUATION: TextMatchTransformer = {
//   dependencies: [EquationNode],
//   export: (node) => {
//     if (!$isEquationNode(node)) {
//       return null;
//     }

//     // 根据是否为内联公式决定输出格式
//     const isInline = node.__inline;
//     return isInline ? `$${node.getEquation()}$` : `$$${node.getEquation()}$$`;
//   },
//   importRegExp: /\$([^$]+?)\$/,
//   regExp: /\$([^$]+?)\$/,
//   replace: (textNode, match) => {
//     const [fullMatch, equation] = match;

//     // 判断是否为块级公式：$$...$$ 格式
//     const isBlockFormula =
//       fullMatch.startsWith('$$') && fullMatch.endsWith('$$');
//     const isInlineFormula =
//       fullMatch.startsWith('$') && fullMatch.endsWith('$') && !isBlockFormula;

//     if (isBlockFormula || isInlineFormula) {
//       const equationNode = $createEquationNode(
//         equation.trim(),
//         isInlineFormula,
//       );
//       textNode.replace(equationNode);
//     }
//   },
//   trigger: '$',
//   type: 'text-match',
// };

export const EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }

    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: '$',
  type: 'text-match',
};

// LaTeX 内联公式 transformer - 处理 \(...\) 格式
export const LATEX_INLINE_EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }
    // 只导出内联公式为 LaTeX 格式
    return node.__inline ? `\\(${node.getEquation()}\\)` : null;
  },
  importRegExp: /\\\(([^\\]*(?:\\.[^\\]*)*?)\\\)/,
  regExp: /\\\(([^\\]*(?:\\.[^\\]*)*?)\\\)/,
  replace: (textNode, match) => {
    const [, equation] = match;

    // 创建内联公式节点
    const equationNode = $createEquationNode(equation.trim(), true);
    textNode.replace(equationNode);
  },
  trigger: '\\(',
  type: 'text-match',
};

// LaTeX 块级公式 transformer - 处理 \[...\] 格式
export const LATEX_BLOCK_EQUATION: MultilineElementTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }
    // 只导出非内联的公式为 LaTeX 块级格式
    return node.__inline ? null : `\\[${node.getEquation()}\\]`;
  },
  regExpStart: /^\s*\\\[/,
  regExpEnd: /^\s*\\\]$/,
  replace: (
    rootNode,
    children,
    startMatch,
    endMatch,
    linesInBetween,
    isImport,
  ) => {
    // 提取公式内容
    let equation = '';

    if (linesInBetween && linesInBetween.length > 0) {
      // 合并中间行的内容，保持换行符
      equation = linesInBetween.join('\n').trim();
    }

    // 创建块级公式节点
    const equationNode = $createEquationNode(equation, false); // false 表示块级

    // 替换匹配的内容
    if (children && children.length > 0) {
      // 如果有子节点，替换第一个子节点
      const firstChild = children[0];
      if (firstChild) {
        firstChild.replace(equationNode);
      }
    } else {
      // 如果没有子节点，直接插入
      rootNode.append(equationNode);
    }

    return true;
  },
  type: 'multiline-element',
};
// 块级公式 transformer - 处理多行块级公式
export const EQUATION_BLOCK: MultilineElementTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }
    // 只导出非内联的公式为块级格式
    return node.__inline ? null : `$$${node.getEquation()}$$`;
  },
  regExpStart: /^([\s\S]*?)\$\$/,
  regExpEnd: /^([\s\S]*?)\$\$$/,
  replace: (
    rootNode,
    children,
    startMatch,
    endMatch,
    linesInBetween,
    isImport,
  ) => {
    // 提取公式内容
    let equation = '';

    if (linesInBetween && linesInBetween.length > 0) {
      // 合并中间行的内容，保持换行符
      equation = linesInBetween.join('\n').trim();
    }

    // 创建块级公式节点
    const equationNode = $createEquationNode(equation, false); // false 表示块级

    // 替换匹配的内容
    if (children && children.length > 0) {
      // 如果有子节点，替换第一个子节点
      const firstChild = children[0];
      if (firstChild) {
        firstChild.replace(equationNode);
      }
    } else {
      // 如果没有子节点，直接插入
      rootNode.append(equationNode);
    }

    return true;
  },
  type: 'multiline-element',
};

export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
  HR,
  EQUATION_BLOCK,
  LATEX_BLOCK_EQUATION,
  EQUATION,
  LATEX_INLINE_EQUATION,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];
