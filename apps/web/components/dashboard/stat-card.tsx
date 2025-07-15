import { LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={`transition-shadow hover:shadow-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change || description) && (
          <p className="text-muted-foreground text-xs">
            {change && (
              <span
                className={`inline-flex items-center ${
                  changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change}
              </span>
            )}
            {change && description && ' '}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
