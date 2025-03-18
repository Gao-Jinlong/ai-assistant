'use client';

import { AuthProvider } from '@web/contexts/auth-context';
import { Toaster } from '@web/components/ui/sonner';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { TrpcProvider } from '@web/contexts/trpc-context';
import LanguageSwitcher from '@web/components/language-switcher';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();

  return (
    <TrpcProvider>
      <AuthProvider>
        <div className="flex h-screen w-screen flex-col">
          <div className="flex w-full items-center justify-between border-b pl-4 pr-4">
            <Link href="/dashboard" className="flex p-2 font-bold">
              <Image
                src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
                alt="logo"
                width={16}
                height={26}
                className="mr-2"
              />
              {t('brand.name')}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex flex-1">{children}</div>
        </div>
        <Toaster />
      </AuthProvider>
    </TrpcProvider>
  );
}
