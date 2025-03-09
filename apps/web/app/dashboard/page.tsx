'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@web/components/ui/card';
import { getUserPayload, useAuth } from '@web/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { trpc } from '../trpc';

export default function Dashboard() {
  const { payload, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !payload && !getUserPayload()) {
      router.push('/login');
    }
  }, [loading, payload, router, getUserPayload]);

  const { mutate: deleteUser } = trpc.user.delete.useMutation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        加载中...
      </div>
    );
  }

  const user = useMemo(() => {
    return payload?.user;
  }, [payload]);

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">用户仪表盘</h1>
        <Button variant="outline" onClick={logout}>
          退出登录
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage
                src={user.avatar ?? undefined}
                alt={user.name ?? undefined}
              />
              <AvatarFallback>
                {user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p>欢迎回来！这是您的个人仪表盘。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">暂无活动记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">用户ID:</span>
                <span>{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">账号状态:</span>
                <span className="text-green-600">正常</span>
              </div>

              <div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteUser(user.uid);
                  }}
                >
                  删除账号
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
