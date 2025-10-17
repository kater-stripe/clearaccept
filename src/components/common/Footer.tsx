'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();
  const { customLogo } = useDemoConfig();

  return (
    <footer className='bg-brand-tertiary' aria-labelledby='footer-heading'>
      <div className='mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32'>
        <div className='lg:grid lg:grid-cols-2 lg:gap-8'>
          <div className='xl:col-span-1 xl:mt-0'>
            <img
              className={`h-16 w-auto ${customLogo ? 'invisible' : ''}`}
              src={'/img/brand/logo.svg'}
              alt='Tahoe Logo'
            />
          </div>

          <div className='mt-16 xl:col-span-1 xl:mt-0'>
            <div className='md:grid md:grid-cols-3 md:gap-8'>
              <div>
                <h3 className='text-sm font-semibold leading-6 text-brand-tertiary-contrasting-text'>
                  {t('footer.col1.title')}
                </h3>
                <ul className='mt-6 space-y-4'>
                  {(
                    t('footer.col1.links', { returnObjects: true }) as string[]
                  ).map((link, index) => (
                    <li key={index}>
                      <a
                        href='#'
                        className='text-sm leading-6 text-brand-tertiary-contrasting-text cursor-default'
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='hidden md:block mt-6 md:mt-0'>
                <h3 className='text-sm font-semibold leading-6 text-brand-tertiary-contrasting-text'>
                  {t('footer.col2.title')}
                </h3>
                <ul className='mt-6 space-y-4'>
                  {(
                    t('footer.col2.links', { returnObjects: true }) as string[]
                  ).map((link, index) => (
                    <li key={index}>
                      <a
                        href='#'
                        className='text-sm leading-6 text-brand-tertiary-contrasting-text cursor-default'
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
