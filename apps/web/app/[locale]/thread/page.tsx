'use client';

import ThreadContent from '@web/components/thread-content';
import ThreadInput from '@web/components/thread-input';

export default function ChatPage() {
  return (
    <div className="flex h-screen w-full flex-1 flex-col">
      <div className="flex w-full flex-1 overflow-hidden">
        <ThreadContent />
      </div>
      <div className="flex w-full overflow-hidden p-8">
        <ThreadInput />
      </div>
    </div>
  );
}
