declare module 'markdown-it-katex' {
  import type MarkdownIt from 'markdown-it';
  const plugin: (md: MarkdownIt) => MarkdownIt;
  export default plugin;
}
