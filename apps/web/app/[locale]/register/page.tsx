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
import { RegisterDto, useAuth } from '@web/contexts/auth-context';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRPCClientError } from '@trpc/client';
import { useTranslations, useLocale } from 'next-intl';
import { AuthLayout } from '@web/components/auth/auth-layout';
import { AuthMessage } from '@web/components/auth/auth-message';
import { AuthFooter } from '@web/components/auth/auth-footer';

const formSchema = z
  .object({
    email: z.string().email({
      message: '请输入有效的电子邮箱',
    }),
    password: z.string().min(6, {
      message: '密码至少需要6个字符',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
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
      confirmPassword: '',
    },
  });

  const handleSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setLoading(true);
      setMessage(null);

      try {
        await register({
          email: values.email,
          password: values.password,
        });

        setMessage({
          type: 'success',
          text: t('register.success'),
        });

        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      } catch (error) {
        if (error instanceof TRPCClientError) {
          setMessage({
            type: 'error',
            text: error.message,
          });
        } else {
          setMessage({
            type: 'error',
            text: t('register.unknownError'),
          });
        }
      }

      setLoading(false);
    },
    [register, router, locale, t],
  );

  return (
    <AuthLayout
      title={t('common.register')}
      description={t('register.description')}
      footer={
        <AuthFooter
          text={t('register.alreadyHaveAccount')}
          linkText={t('common.login')}
          linkHref={`/${locale}/login`}
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
                <FormLabel>{t('common.password')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('register.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span>{t('dashboard.loading')}</span>
            ) : (
              t('common.registerButton')
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
