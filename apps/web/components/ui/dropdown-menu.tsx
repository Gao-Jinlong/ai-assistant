import * as React from 'react';
import { cn } from '@web/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement(child) &&
            child.type === DropdownMenuTrigger
          ) {
            return child;
          }
        })}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {React.Children.map(children, (child) => {
            if (
              React.isValidElement(child) &&
              child.type === DropdownMenuContent
            ) {
              return React.cloneElement(child, {
                onClose: () => setOpen(false),
              } as any);
            }
          })}
        </>
      )}
    </div>
  );
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ asChild, children, className, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ref, className, ...props } as any);
  }
  return (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps & { onClose?: () => void }
>(
  (
    {
      className,
      align = 'start',
      side = 'bottom',
      children,
      onClose,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'bg-popover text-popover-foreground absolute z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
        side === 'bottom' && 'top-full mt-1',
        side === 'top' && 'bottom-full mb-1',
        side === 'right' && 'left-full ml-1',
        side === 'left' && 'right-full mr-1',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2 transform',
        align === 'end' && 'right-0',
        className,
      )}
      {...props}
    >
      <div onClick={onClose}>{children}</div>
    </div>
  ),
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      className: cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className,
      ),
      ...props,
    } as any);
  }

  return (
    <div
      ref={ref}
      className={cn(
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('bg-muted -mx-1 my-1 h-px', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
