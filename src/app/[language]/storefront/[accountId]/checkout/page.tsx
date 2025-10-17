'use client';

import { Checkout } from '@/components/checkout/Checkout';
import { useCart } from '@/context/CartContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';

const CheckoutPage = () => {
  const { items } = useCart();
  const router = useRouter();
  const { language } = useDemoConfig();
  const { account } = useDemoMerchant();

  useEffect(() => {
    if (items.length > 0) {
      return;
    }

    router.push(`/${language}/storefront/${account?.id}`);
  }, [items.length, account?.id, language]);

  if (items.length === 0) {
    return <LoadingOverlay />;
  }

  const hasAtLeastOneGood = items.some(
    (item) => item.product.metadata.category === 'good',
  );

  return (
    <div className='py-8 lg:py-12 lg:mx-auto lg:max-w-7xl'>
      <Checkout shippingOptionsOverride={hasAtLeastOneGood ? undefined : []} />
    </div>
  );
};

export default CheckoutPage;
