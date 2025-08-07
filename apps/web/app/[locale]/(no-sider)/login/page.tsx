'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@web/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@web/components/ui/form';
import { Input } from '@web/components/ui/input';
import { z } from 'zod';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRPCClientError } from '@trpc/client';
import { Checkbox } from '@web/components/ui/checkbox';
import { useTranslations, useLocale } from 'next-intl';
import { AuthLayout } from '@web/components/auth/auth-layout';
import { AuthMessage } from '@web/components/auth/auth-message';
import { AuthFooter } from '@web/components/auth/auth-footer';
import Link from 'next/link';
import { userService } from '@web/service';
import useBoundStore from '@web/store';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().default(false),
});

export default function Login() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const setLoginInfo = useBoundStore((state) => state.setLoginInfo);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

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
        const result = await userService.login(values);

        if (result) {
          setMessage({
            type: 'success',
            text: t('common.loginSuccess'),
          });
          setLoginInfo(result.data);
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 1000);
        }
      } catch (error) {
        console.error('🚀 ~ error:', error);
        if (error instanceof TRPCClientError) {
          setMessage({
            type: 'error',
            text: error.message,
          });
        }
      }

      setLoading(false);
    },
    [t, setLoginInfo, router, locale],
  );

  return (
    <AuthLayout
      title={t('common.login')}
      description={t('common.loginDescription', {
        defaultValue: 'Enter your email to sign in to your account',
      })}
      footer={
        <AuthFooter
          text={t('common.noAccount')}
          linkText={t('common.createAccount')}
          linkHref={`/${locale}/register`}
        />
      }
    >
      {message && <AuthMessage type={message.type} text={message.text} />}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span>{t('dashboard.loading')}</span>
            ) : (
              t('common.loginButton')
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
