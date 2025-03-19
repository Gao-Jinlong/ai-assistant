import { Conversation } from '@ant-design/x/es/conversations';
import { trpc } from '@web/app/trpc';

export interface IConversation extends Conversation {
  data: Awaited<
    ReturnType<typeof trpc.conversation.findOne.useMutation>
  >['data'];
}
