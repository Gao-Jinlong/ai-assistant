import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function BrandLogo() {
  const t = useTranslations();
  return (
    <div>
      <Image
        src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
        alt={t('brand.name')}
        width={32}
        height={32}
      />
    </div>
  );
}
