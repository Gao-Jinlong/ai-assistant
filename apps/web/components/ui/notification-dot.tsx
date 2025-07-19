import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@web/lib/utils';

const notificationDotVariants = cva(
  'absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full text-[10px] font-bold leading-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
        outline: 'border-2 border-red-500 bg-white text-red-500',
      },
      size: {
        sm: 'h-2 w-2',
        md: 'h-3 w-3',
        lg: 'h-4 w-4 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface NotificationDotProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationDotVariants> {
  children: React.ReactNode;
  show?: boolean;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
}

const NotificationDot = ({
  className,
  variant,
  size,
  children,
  show = true,
  count,
  maxCount = 99,
  showZero = false,
  ...props
}: NotificationDotProps) => {
  const shouldShow = show && (count === undefined || count > 0 || showZero);

  const displayCount =
    count !== undefined && count > maxCount ? `${maxCount}+` : count;

  return (
    <div className="relative" {...props}>
      {children}
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: {
                type: 'spring',
                stiffness: 500,
                damping: 25,
              },
            }}
            exit={{
              scale: 0,
              opacity: 0,
              transition: {
                duration: 0.15,
              },
            }}
            className={cn(
              notificationDotVariants({ variant, size }),
              className,
            )}
          >
            {count !== undefined && count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                {displayCount}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { NotificationDot, notificationDotVariants };
