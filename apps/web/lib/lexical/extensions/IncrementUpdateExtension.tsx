import {
  $getSelection,
  $getRoot,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  defineExtension,
  ExtensionConfigBase,
  ExtensionRegisterState,
  LexicalEditor,
  $createTextNode,
  $createParagraphNode,
  $isParagraphNode,
} from 'lexical';

export const INCREMENT_UPDATE_COMMAND = createCommand(
  'INCREMENT_UPDATE_COMMAND',
);

function registerIncrementUpdate(
  editor: LexicalEditor,
  config: ExtensionConfigBase,
  state: ExtensionRegisterState<unknown, unknown>,
) {
  return editor.registerCommand(
    INCREMENT_UPDATE_COMMAND,
    (payload: string) => {
      editor.update(() => {
        const selection = $getSelection();
        const textNode = $createTextNode(payload);

        if (selection) {
          // 将 payload 文本追加到当前选区位置
          selection.insertNodes([textNode]);
        } else {
          // TODO 文本插入不正确导致 markdown 解析失效
          // 如果没有选区，创建新段落并在其中插入文本
          const root = $getRoot();
          const children = root.getChildAtIndex(-1);
          if ($isParagraphNode(children)) {
            children.append(textNode);
          } else {
            const paragraphNode = $createParagraphNode();
            paragraphNode.append(textNode);
            root.append(paragraphNode);
          }
          textNode.select();
        }
      });
      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );
}

const IncrementUpdateExtension = defineExtension({
  name: 'IncrementUpdateExtension',
  namespace: 'IncrementUpdateExtension',
  dependencies: [],
  afterRegistration: (editor, config, state) => {
    return registerIncrementUpdate(editor, config, state);
  },
});

export default IncrementUpdateExtension;
