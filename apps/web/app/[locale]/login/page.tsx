'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@web/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@web/components/ui/form';
import { Input } from '@web/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { z } from 'zod';
import { useAuth } from '@web/contexts/auth-context';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRPCClientError } from '@trpc/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@web/components/ui/checkbox';
import { useTranslations, useLocale } from 'next-intl';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().default(false),
});

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setLoading(true);
      setMessage(null);

      try {
        const result = await login(values);

        if (result) {
          setMessage({
            type: 'success',
            text: t('common.loginSuccess'),
          });
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 1000);
        }
      } catch (error) {
        if (error instanceof TRPCClientError) {
          setMessage({
            type: 'error',
            text: error.message,
          });
        }
      }

      setLoading(false);
    },
    [login, router, locale, t],
  );

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('common.login')}
          </CardTitle>
          <CardDescription>
            {t('common.loginDescription', {
              defaultValue: 'Enter your email to sign in to your account',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`p-3 mb-4 text-sm border rounded-md flex items-center gap-2 ${
                message.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-green-50 border-green-200 text-green-600'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {message.text}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        {...field}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('common.password')}</FormLabel>
                      <Link
                        href={`/${locale}/forgot-password`}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        {t('common.forgotPassword')}
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="leading-none">
                      <FormLabel>{t('common.rememberMe')}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {t('common.loginButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600">
            {t('common.noAccount')}{' '}
            <Link
              href={`/${locale}/register`}
              className="font-medium text-primary hover:underline"
            >
              {t('common.createAccount')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
