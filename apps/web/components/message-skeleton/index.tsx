'use client';

import { Skeleton } from '@web/components/ui/skeleton';

const MessageSkeleton = () => {
  return (
    <div className="w-full space-y-6 p-6">
      {/* Second message (User) */}
      <div className="ml-auto w-full max-w-4xl">
        <div className="flex flex-col items-end space-y-3 rounded-lg p-4">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>

      {/* Third message (Assistant) */}
      <div className="w-full max-w-4xl">
        <div className="space-y-3 rounded-lg p-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
