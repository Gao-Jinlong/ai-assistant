'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const options = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
  ];

  const handleChange = (newLocale: string) => {
    // 获取当前路径并替换语言部分
    const newPath = pathname?.replace(`/${locale}`, `/${newLocale}`);

    startTransition(() => {
      router.push(newPath ?? '/');
    });
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-20">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
