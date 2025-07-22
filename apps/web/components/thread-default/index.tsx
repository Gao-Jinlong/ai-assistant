import useBoundStore from '@web/store';
import { useTranslations } from 'next-intl';

const ThreadDefault = () => {
  const t = useTranslations();
  const nickname = useBoundStore((state) => state.loginInfo?.user.nickname);

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
      <div className="text-2xl font-bold">
        {t('thread.default.hello', {
          name: nickname ?? t('common.nickname'),
        })}
      </div>
      <div className="text-sm text-gray-500">
        {t('thread.default.greeting')}
      </div>
    </div>
  );
};

export default ThreadDefault;
