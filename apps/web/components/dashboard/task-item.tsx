import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Calendar } from 'lucide-react';
import { cn } from '@web/lib/utils';

type Priority = 'high' | 'medium' | 'low';
type Status = 'completed' | 'inProgress' | 'pending';

interface TaskItemProps {
  id: number;
  title: string;
  project: string;
  priority: Priority;
  status: Status;
  assignee: {
    name: string;
    avatar?: string | null;
  };
  dueDate: string;
  onClick?: () => void;
  className?: string;
}

export function TaskItem({
  title,
  project,
  priority,
  status,
  assignee,
  dueDate,
  onClick,
  className,
}: TaskItemProps) {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inProgress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'inProgress':
        return '进行中';
      case 'pending':
        return '待开始';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      case 'low':
        return '低优先级';
      default:
        return priority;
    }
  };

  return (
    <div
      className={cn(
        'hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={assignee.avatar || ''} />
          <AvatarFallback>{assignee.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-sm">{project}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span
          className={`rounded-full border px-2 py-1 text-xs ${getPriorityColor(priority)}`}
        >
          {getPriorityText(priority)}
        </span>
        <span
          className={`rounded-full border px-2 py-1 text-xs ${getStatusColor(status)}`}
        >
          {getStatusText(status)}
        </span>
        <div className="text-muted-foreground flex items-center text-xs">
          <Calendar className="mr-1 h-3 w-3" />
          {dueDate}
        </div>
      </div>
    </div>
  );
}
