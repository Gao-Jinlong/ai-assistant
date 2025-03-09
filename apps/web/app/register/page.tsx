'use client';

import { useCallback, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@web/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@web/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@web/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { TRPCClientError } from '@trpc/client';
// 定义表单验证模式
const formSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export default function Register() {
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const router = useRouter();

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setLoading(true);
      setMessage(null);

      try {
        await register(values);

        await login(values);

        router.push('/dashboard');

        setLoading(false);
      } catch (error) {
        if (error instanceof TRPCClientError) {
          setMessage({
            type: 'error',
            text: error.message,
          });
        }
      }
    },
    [],
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md mb-40">
        <CardHeader>
          <CardTitle className="text-2xl text-center">用户注册</CardTitle>
          <CardDescription className="text-center">
            创建您的账户以开始使用我们的服务
          </CardDescription>
        </CardHeader>

        <CardContent>
          {message && (
            <Alert
              className={`mb-6 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : 'bg-green-50 text-green-900 border-green-200'
              }`}
            >
              <AlertCircle
                className={`h-4 w-4 ${
                  message.type === 'error' ? 'text-red-600' : 'text-green-600'
                }`}
              />
              <AlertTitle>
                {message.type === 'error' ? '错误' : '成功'}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
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
                    <FormLabel>电子邮箱</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="请输入邮箱地址"
                        {...field}
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
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  '注册'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            已有账户？{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              登录
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
