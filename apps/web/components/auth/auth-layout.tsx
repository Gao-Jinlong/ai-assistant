import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && (
          <CardFooter className="flex justify-center">{footer}</CardFooter>
        )}
      </Card>
    </div>
  );
}
