'use client';

import { AuthProvider } from '@web/contexts/auth-context';
import { TrpcProvider } from '@web/contexts/trpc-context';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

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
          <Link
            href="/dashboard"
            className="flex w-full border-b p-2 font-bold"
          >
            <Image
              src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
              alt="logo"
              width={16}
              height={26}
              className="mr-2"
            />
            {t('brand.name')}
          </Link>
          <div className="flex flex-1">{children}</div>
        </div>
      </AuthProvider>
    </TrpcProvider>
  );
}
