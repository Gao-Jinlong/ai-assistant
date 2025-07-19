import useBoundStore from '@web/store';
import { navigation, RouterItem } from '@web/store/router';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';

function useRouterMatch() {
  const setRouter = useBoundStore((state) => state.setRouter);
  const pathname = usePathname();

  const routerMap = useMemo(() => {
    return navigation.reduce(
      (acc, item) => {
        acc[item.href] = item;
        return acc;
      },
      {} as Record<string, RouterItem>,
    );
  }, []);

  useEffect(() => {
    const pathWithoutLocale =
      pathname?.replace(/^\/[a-z]{2}(-[a-z]{2})?(\/|$)/i, '/') ?? '/';
    const newRouter = routerMap[pathWithoutLocale];
    if (newRouter) {
      setRouter(newRouter);
    }
  }, [pathname, setRouter, routerMap]);

  return null;
}
export default useRouterMatch;
