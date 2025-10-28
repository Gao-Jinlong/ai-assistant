'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function HomePage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // 重定向到对话页面
    router.replace(`/${locale}/thread`);
  }, [router, locale]);

  // 显示加载状态
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-gray-600">正在跳转到对话页面...</p>
      </div>
    </div>
  );
}
