import { createQueryKeys } from '@lukemorales/query-key-factory';
import { threadService } from '@web/service';
import { ThreadDto } from '@web/service/thread';

const thread = createQueryKeys('thread', {
  getThreads: {
    queryKey: null,
    queryFn: threadService.getThreads,
  },
  getThreadMessages: (id: ThreadDto['id']) => ({
    queryKey: [id],
    queryFn: () => threadService.getThreadMessages(id),
  }),
});

export default thread;
