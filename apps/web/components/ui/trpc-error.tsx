import { TRPCClientError } from '@trpc/client';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@web/components/ui/alert';
import { handleTRPCError, ErrorType } from '@web/lib/trpc/error-handler';
import { useTranslations } from 'next-intl';

interface TrpcErrorProps {
  error: unknown;
  title?: string;
  className?: string;
}

export function TrpcError({ error, title, className }: TrpcErrorProps) {
  const t = useTranslations('errors');
  const [errorInfo, setErrorInfo] = useState<{
    type: ErrorType;
    message: string;
    title: string;
  }>({
    type: ErrorType.UNKNOWN,
    message: '',
    title: title || t('defaultTitle'),
  });

  useEffect(() => {
    const { type, message } = handleTRPCError(error);

    let errorTitle = title || t('defaultTitle');
    // 可以根据不同错误类型设置不同标题
    if (type === ErrorType.AUTHENTICATION) {
      errorTitle = t('authTitle');
    } else if (type === ErrorType.VALIDATION) {
      errorTitle = t('validationTitle');
    }

    setErrorInfo({ type, message, title: errorTitle });
  }, [error, title, t]);

  if (!error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription>{errorInfo.message}</AlertDescription>
    </Alert>
  );
}
