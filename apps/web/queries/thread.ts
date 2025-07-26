import { createQueryKeys } from '@lukemorales/query-key-factory';
import service from '@web/service';
import { ThreadDto } from '@web/service/thread';

const thread = createQueryKeys('thread', {
  getThreads: {
    queryKey: null,
    queryFn: service.thread.getThreads,
  },
  getThreadMessages: (id: ThreadDto['id']) => ({
    queryKey: [id],
    queryFn: () => service.thread.getThreadMessages(id),
  }),
});

export default thread;
