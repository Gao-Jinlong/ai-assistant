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
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { LexicalNode } from 'lexical';

import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from '../../nodes/EquationNode';

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
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

export const EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }

    // 根据是否为内联公式决定输出格式
    const isInline = node.__inline;
    return isInline ? `$${node.getEquation()}$` : `$$${node.getEquation()}$$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$/,
  replace: (textNode, match) => {
    const [fullMatch, equation] = match;

    // 判断是否为块级公式：$$...$$ 格式
    const isBlockFormula =
      fullMatch.startsWith('$$') && fullMatch.endsWith('$$');
    const isInlineFormula =
      fullMatch.startsWith('$') && fullMatch.endsWith('$') && !isBlockFormula;

    if (isBlockFormula || isInlineFormula) {
      const equationNode = $createEquationNode(
        equation.trim(),
        isInlineFormula,
      );
      textNode.replace(equationNode);
    }
  },
  trigger: '$',
  type: 'text-match',
};
// TODO 块级公式
export const EQUATION_BLOCK: ElementTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }
    return `$$${node.getEquation()}$$`;
  },
  regExp: /^\$\$([\s\S]*?)\$\$$/,
  replace: (parentNode, children, match, isImport) => {
    console.log('🚀 ~ parentNode:', parentNode, 'match:', match);
    if (match && match[1]) {
      const equation = match[1].trim();
      const equationNode = $createEquationNode(equation, false);

      // 清空父节点的所有子节点
      parentNode.clear();

      // 插入公式节点
      parentNode.append(equationNode);
    }
  },
  type: 'element',
};

export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
  HR,
  EQUATION_BLOCK,
  EQUATION,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];
