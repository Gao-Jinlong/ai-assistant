'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@web/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { getUserPayload, useAuth } from '@web/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { trpc } from '../../trpc';
import { useTranslations, useLocale } from 'next-intl';

export default function Dashboard() {
  const { payload, loading, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !payload && !getUserPayload()) {
      router.push(`/${locale}/login`);
    }
  }, [loading, payload, router, locale, getUserPayload]);

  const { mutate: deleteUser } = trpc.user.delete.useMutation({
    onSuccess: () => {
      logout();
      router.push(`/${locale}`);
    },
    onError: (error) => {
      console.error('删除账号失败:', error);
    },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {t('loading')}
      </div>
    );
  }

  const user = useMemo(() => {
    return payload?.user;
  }, [payload]);

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button variant="outline" onClick={logout}>
          {t('logout')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage
                src={user.avatar ?? undefined}
                alt={user.name ?? undefined}
              />
              <AvatarFallback>
                {user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p>{t('welcome')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">{t('noActivity')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('accountInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('userId')}:</span>
                <span>{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('accountStatus')}:</span>
                <span className="text-green-600">{t('statusNormal')}</span>
              </div>

              <div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  {t('deleteAccount')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAccountTitle')}</DialogTitle>
            <DialogDescription>{t('deleteAccountConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteUser(user.uid);
                setDeleteDialogOpen(false);
              }}
            >
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
