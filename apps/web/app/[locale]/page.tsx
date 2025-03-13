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
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            {t('home.welcome')}
          </CardTitle>
          <CardDescription className="text-xl mt-2">
            {t('home.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="py-6">
          <p className="text-gray-600 mb-6">{t('home.startNow')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
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
