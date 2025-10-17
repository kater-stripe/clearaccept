'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCountdown } from 'usehooks-ts';
import { useEffect } from 'react';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

const Success = () => {
  const router = useRouter();
  const { clearCart } = useCart();
  const { language } = useDemoConfig();
  const { account } = useDemoMerchant();

  const { t } = useTranslation();

  const [countdown, { startCountdown, stopCountdown }] = useCountdown({
    countStart: 3,
    intervalMs: 1000,
  });

  useEffect(() => {
    clearCart();

    startCountdown();
  }, []);

  useEffect(() => {
    if (countdown === 1) {
      stopCountdown();
      router.push(`/${language}/storefront/${account?.id}`);
    }
  }, [countdown]);

  return (
    <div className='py-24 flex flex-col max-w-7xl mx-auto text-center'>
      <Image
        src='/img/icon/check-circle-outlined.svg'
        alt='Success checkmark circle'
        height={16}
        width={16}
        className='h-16 w-16 inline mx-auto'
      />

      <h1 className='mt-2 text-4xl font-extrabold text-brand-primary tracking-tight sm:text-5xl'>
        {t('success.title')}
      </h1>
      <div className='mt-6'>
        <div className='text-base font-medium text-brand-primary hover:shadow-none text-md'>
          {t('success.description', {
            countdown,
          })}
        </div>
      </div>
    </div>
  );
};

export default Success;
