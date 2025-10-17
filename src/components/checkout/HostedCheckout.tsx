'use client';

import { type ComponentProps, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { createHostedCheckoutSession } from '@/app/api/checkout-sessions/createHostedCheckoutSession';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCart } from '@/context/CartContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useHandleCallbacks } from '@/components/checkout/HandleCallbacks';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

export const HostedCheckout = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  const router = useRouter();

  const { language, currency, stripeSecretKey, chargeType } = useDemoConfig();

  const { items } = useCart();

  const { id: customerId, email: customerEmail } = useDemoCustomer();

  const { account } = useDemoMerchant();

  const pathname = usePathname();

  const { successUrl } = useHandleCallbacks();

  const cancelUrl = useMemo(() => {
    if (pathname.startsWith(`/${language}/storefront/`)) {
      return `${window.location.origin}/${language}/storefront/${account?.id}`;
    }

    return `${window.location.origin}/${language}/dashboard`;
  }, [pathname]);

  const { data: hostedSession, isFetching: isFetchingHostedSession } = useQuery(
    {
      queryKey: [
        'checkoutSessions',
        currency,
        customerEmail,
        customerId,
        items,
        language,
        stripeSecretKey,
        chargeType,
        account!.id,
        successUrl,
      ],
      queryFn: () =>
        createHostedCheckoutSession({
          cancelUrl,
          successUrl,
          currency,
          customerEmail,
          customerId,
          items,
          language,
          stripeSecretKey,
          chargeType,
          accountId: account!.id,
        }),
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      staleTime: 0,
    },
  );

  useEffect(() => {
    if (hostedSession === undefined) {
      return;
    }

    if (isFetchingHostedSession) {
      return;
    }

    if (!hostedSession.url) {
      return;
    }

    router.push(hostedSession.url);
  }, [hostedSession, isFetchingHostedSession]);

  return (
    <div className={`mx-auto max-w-4xl lg:max-w-7xl ${className}`} {...props}>
      <LoadingSpinner className='text-black' />
    </div>
  );
};
