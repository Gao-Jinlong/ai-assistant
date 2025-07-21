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
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@web/components/language-switcher';

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center bg-gray-50 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            {t('home.welcome')}
          </CardTitle>
          <CardDescription className="mt-2 text-xl">
            {t('home.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="py-6">
          <p className="mb-6 text-gray-600">{t('home.startNow')}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button asChild size="lg" className="w-full">
              <Link href={`/${locale}/register`}>{t('common.register')}</Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={`/${locale}/login`}>{t('common.login')}</Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {t('brand.name')}.{' '}
            {t('home.copyright')}
          </p>
        </CardFooter>
      </Card>

      <div className="mt-12 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('home.features.easyToUse')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('home.features.easyToUseDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('home.features.powerful')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('home.features.powerfulDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('home.features.secure')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('home.features.secureDesc')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
