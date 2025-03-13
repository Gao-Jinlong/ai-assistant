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
import { useTranslations, useLocale } from 'next-intl';

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: '名称至少需要2个字符',
    }),
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

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
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
    <div className="flex flex-1 items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('common.register')}
          </CardTitle>
          <CardDescription>{t('register.description')}</CardDescription>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('register.namePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {t('common.registerButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600">
            {t('register.alreadyHaveAccount')}{' '}
            <Link
              href={`/${locale}/login`}
              className="font-medium text-primary hover:underline"
            >
              {t('common.login')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
