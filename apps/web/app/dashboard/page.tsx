'use client';

import { useEffect, useState } from 'react';
import { Button } from '@web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@web/components/ui/card';

interface UserInfo {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从localStorage获取用户信息
    const storedInfo = localStorage.getItem('userInfo');
    if (storedInfo) {
      try {
        setUserInfo(JSON.parse(storedInfo));
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    // 清除token和用户信息
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('userInfo');

    // 重定向到首页
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        加载中...
      </div>
    );
  }

  if (!userInfo) {
    // 如果没有用户信息，重定向到登录页面
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">用户仪表盘</h1>
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
              <AvatarFallback>
                {userInfo.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{userInfo.name}</CardTitle>
            <CardDescription>{userInfo.email}</CardDescription>
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
                <span>{userInfo.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">账号状态:</span>
                <span className="text-green-600">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">注册日期:</span>
                <span>2023年1月1日</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
