import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import ClientLayout from './client-layout';
import 'allotment/dist/style.css';
import { cn } from '@web/lib/utils';
import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const paramsData = await params;
  const locale = paramsData.locale;

  return {
    title: `AI Assistant - ${locale.toUpperCase()}`,
    description: 'An AI-powered assistant application',
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const paramsData = await params;
  const locale = paramsData.locale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable)}>
        <NextIntlClientProvider>
          <ClientLayout>{children}</ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
