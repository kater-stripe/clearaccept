'use client';

import { Container } from '@/components/common/Container';
import Image from 'next/image';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { SignInCard } from '@/components/account/SignInCard';
import { Logo } from '@/components/common/Logo';

const SignInPage = () => {
  const { customHero } = useDemoConfig();

  return (
    <div className='relative grow bg-gray-100'>
      <div aria-hidden='true' className='absolute inset-0'>
        <Image
          src={customHero || '/img/hero/background.png'}
          alt='Hero background'
          width={0}
          height={0}
          sizes='100vw'
          className='w-full h-full object-cover'
          priority={true}
        />
      </div>
      <div className='relative z-20'>
        <Container className='py-30'>
          {/**
           * The container's max width is 7xl which is a little large for the sign up page.
           * We'll add an additional container with a max width of 2xl to make the sign up card smaller.
           */}
          <div className='max-w-2xl mx-auto'>
            <Logo className='h-10 mb-4 mx-auto' />
            <SignInCard />
          </div>
        </Container>
      </div>
    </div>
  );
};

export default SignInPage;
