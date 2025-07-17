import { Link } from '@web/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';

const Brand = ({
  isCollapsed,
  link = '/dashboard',
}: {
  isCollapsed: boolean;
  link?: string;
}) => {
  const t = useTranslations();

  return (
    <Link href={link} className="flex items-center gap-2 font-semibold">
      <Image
        src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
        alt="logo"
        width={20}
        height={20}
        className="flex-shrink-0"
      />
      <motion.span
        className="text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {t('brand.name')}
      </motion.span>
    </Link>
  );
};

export default Brand;
