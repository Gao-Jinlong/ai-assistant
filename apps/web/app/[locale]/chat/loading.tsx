import { Skeleton } from '@web/components/ui/skeleton';

export default function ChatLoading() {
  return (
    <div className="flex flex-1 items-center justify-center gap-4 p-4">
      <div className="flex h-full flex-1 flex-col justify-start space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="flex h-full flex-[6] flex-col justify-between space-y-4">
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
