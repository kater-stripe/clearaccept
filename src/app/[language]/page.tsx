'use client';

import { Hero } from '@/components/index/Hero';
import { useDemoConfig } from '@/context/DemoConfigContext';
import Image from 'next/image';

const IndexPage = () => {
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
      <Hero className='relative z-20' />
    </div>
  );
};

export default IndexPage;
