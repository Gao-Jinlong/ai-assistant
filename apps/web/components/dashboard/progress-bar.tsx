import { cn } from '@web/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'green' | 'blue' | 'purple' | 'red' | 'yellow';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorClasses = {
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            colorClasses[color],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
