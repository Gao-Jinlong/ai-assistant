import { Link } from '@web/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

const Brand = ({
  isSimple,
  link = '/dashboard',
}: {
  isSimple: boolean;
  link?: string;
}) => {
  const t = useTranslations();

  return (
    <Link
      href={link}
      className="flex items-center justify-center gap-2 font-semibold"
    >
      <div className="flex w-8 shrink-0 items-center justify-center">
        <Image
          src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
          alt="logo"
          width={20}
          height={31}
          className="aspect-auto h-auto shrink-0"
        />
      </div>

      <AnimatePresence>
        {!isSimple && (
          <motion.span
            className="text-lg"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
          >
            {t('brand.name')}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

export default Brand;
