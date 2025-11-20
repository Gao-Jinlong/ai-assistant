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
  COMMAND_PRIORITY_HIGH,
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
    COMMAND_PRIORITY_HIGH,
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
