import * as React from 'react';
import { cn } from '@web/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const TooltipProvider = ({ children }: TooltipProps) => {
  return <>{children}</>;
};

const Tooltip = ({ children }: TooltipProps) => {
  return <div className="group relative">{children}</div>;
};

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props } as any);
    }
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    );
  },
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'top', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'invisible absolute z-50 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100',
        'bg-popover text-popover-foreground rounded-md border px-2 py-1 text-xs shadow-md',
        side === 'top' &&
          'bottom-full left-1/2 mb-2 -translate-x-1/2 transform',
        side === 'right' && 'left-full top-1/2 ml-2 -translate-y-1/2 transform',
        side === 'bottom' &&
          'left-1/2 top-full mt-2 -translate-x-1/2 transform',
        side === 'left' && 'right-full top-1/2 mr-2 -translate-y-1/2 transform',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
