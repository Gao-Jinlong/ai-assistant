'use client';

import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import useBoundStore from '@web/store';

export default function ChatPage() {
  const thread = useBoundStore((state) => state.currentThread);

  return (
    <div className="flex h-screen w-full flex-1 flex-col">
      <div className="flex w-full flex-1 overflow-hidden">
        {thread ? <ThreadContent /> : <ThreadDefault />}
      </div>
      <div className="flex w-full overflow-hidden p-8">
        <ThreadInput />
      </div>
    </div>
  );
}
