import { createQueryKeys } from '@lukemorales/query-key-factory';
import service from '@web/service';

const thread = createQueryKeys('thread', {
  getThreads: {
    queryKey: null,
    queryFn: service.thread.getThreads,
  },
});

export default thread;
