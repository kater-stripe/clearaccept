'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useDemoConfig } from '@/context/DemoConfigContext';

export const OnrampDiscountCta = () => {
  const { language, configure } = useDemoConfig();
  const { t } = useTranslation();

  return (
    <div className='mb-6 flex items-start justify-between rounded-lg border border-green-300 bg-green-50 p-4 text-green-800'>
      <p className='text-sm'>
        <span className='font-bold'>{t('onramp.cta.headline_strong')}</span>{' '}
        {t('onramp.cta.headline_rest')}
        <Link
          href={`/${language}/dashboard/onramp`}
          className='ml-1 font-semibold underline'
        >
          {t('onramp.cta.button')}
        </Link>
      </p>
      <button
        type='button'
        aria-label='Close'
        className='-mr-1 ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-green-500 hover:text-green-600 focus:outline-none'
        onClick={() => {
          configure('cryptoEnabled', false);
        }}
      >
        <span aria-hidden='true' className='text-xl leading-none'>
          ×
        </span>
      </button>
    </div>
  );
};

export default OnrampDiscountCta;
