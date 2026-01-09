'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Container } from '../common/Container';
import { SignUpCard } from '../account/SignUpCard';
import { Logo } from '../common/Logo';
import { type ComponentProps } from 'react';

type HeroProps = ComponentProps<'div'>;

export const Hero = ({ className, ...rest }: HeroProps) => {
  const { t } = useTranslation();

  return (
    <Container
      className={`grid grid-cols-6 gap-6 md:grid-cols-12 py-30 ${className}`}
      {...rest}
    >
      <div className='col-span-6 flex flex-col'>
        <div>
          <Logo className='h-10 mb-4 mx-auto sm:mx-0' />
          <h2 className='w-full text-center font-bold sm:text-left text-2xl tracking-tight text-brand-secondary lg:text-3xl xl:text-4xl'>
            {t('hero.heading')}
          </h2>
          <p className='w-full text-center sm:text-left mx-auto mt-2 text-sm lg:text-md xl:text-lg text-brand-secondary-accent mb-4'>
            {t('hero.subheading')}
          </p>
          <a
            href='#'
            className='w-full cursor-default font-bold sm:text-left mx-auto mt-2 text-sm lg:text-md xl:text-lg text-brand-primary flex justify-center sm:justify-start items-center gap-x-1'
          >
            {t('hero.cta')}
            <ArrowRightIcon className='size-4' strokeWidth={2.5} />
          </a>
        </div>
      </div>
      <div className='col-span-6'>
        <SignUpCard />
      </div>
    </Container>
  );
};
