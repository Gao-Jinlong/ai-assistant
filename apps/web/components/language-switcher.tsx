'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Select } from 'antd';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    // 获取当前路径并替换语言部分
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);

    startTransition(() => {
      router.push(newPath);
    });
  };

  return (
    <Select
      value={locale}
      onChange={handleChange}
      loading={isPending}
      options={[
        { value: 'zh', label: '中文' },
        { value: 'en', label: 'English' },
      ]}
      style={{ width: 100 }}
    />
  );
}
