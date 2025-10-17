'use client';

import { CartPanel } from '@/components/cart/CartPanel';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import type { PropsWithChildren } from 'react';

const StorefrontLayout = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <CartPanel />
      <StorefrontHeader />
      <div className='px-6 lg:px-8 2xl:px-0'>{children}</div>
    </div>
  );
};

export default StorefrontLayout;
