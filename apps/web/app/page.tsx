'use client';

import { Button } from '@web/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            欢迎来到我们的平台
          </CardTitle>
          <CardDescription className="text-xl mt-2">
            一个现代化的应用程序，让您的工作更轻松
          </CardDescription>
        </CardHeader>

        <CardContent className="py-6">
          <p className="text-gray-600 mb-6">
            我们提供强大的功能帮助您高效管理工作和生活，立即开始体验吧！
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Button asChild size="lg" className="w-full">
              <Link href="/register">注册账号</Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/login">登录</Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 我的应用程序. 保留所有权利。
          </p>
        </CardFooter>
      </Card>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>简单易用</CardTitle>
          </CardHeader>
          <CardContent>
            <p>直观的用户界面设计，让您轻松上手，提高工作效率。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>功能强大</CardTitle>
          </CardHeader>
          <CardContent>
            <p>提供全面的工具和功能，满足您各种复杂需求。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>安全可靠</CardTitle>
          </CardHeader>
          <CardContent>
            <p>严格的数据保护措施，确保您的信息安全无忧。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
