'use client';

import { useTranslations } from 'next-intl';
import NavLink from './nav-link';
import useBoundStore from '@web/store';

const Navigation = ({ isSimple }: { isSimple: boolean }) => {
  const t = useTranslations();
  const router = useBoundStore((state) => state.router);
  const navigation = useBoundStore((state) => state.navigation);

  return (
    <nav className="space-y-1 px-3">
      <p className="text-muted-foreground w-10 text-center text-xs font-semibold uppercase tracking-wider">
        {t('sidebar.navigation')}
      </p>

      {navigation.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          isSimple={isSimple}
          isActive={router.key === item.key}
        />
      ))}
    </nav>
  );
};

export default Navigation;
