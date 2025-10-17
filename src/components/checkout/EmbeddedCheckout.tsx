'use client';

import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { type ComponentProps, useMemo } from 'react';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { createEmbeddedCheckoutSession } from '@/app/api/checkout-sessions/createEmbeddedCheckoutSession';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useHandleCallbacks } from '@/components/checkout/HandleCallbacks';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

export const EmbeddedCheckout = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  const {
    stripePublishableKey,
    stripeSecretKey,
    language,
    currency,
    chargeType,
  } = useDemoConfig();

  const { items } = useCart();

  const { id: customerId, email: customerEmail } = useDemoCustomer();

  const { account } = useDemoMerchant();

  const { returnUrl } = useHandleCallbacks();

  const { data: embeddedSession, isFetching: isFetchingEmbeddedSession } =
    useQuery({
      queryKey: [
        'checkoutSession',
        items,
        stripeSecretKey,
        customerId,
        customerEmail,
        language,
        currency,
        chargeType,
        account!.id,
        returnUrl,
      ],
      queryFn: () =>
        createEmbeddedCheckoutSession({
          returnUrl,
          items,
          stripeSecretKey,
          customerId,
          customerEmail,
          language,
          currency,
          chargeType,
          accountId: account!.id,
        }),
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      staleTime: 0,
    });

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) {
      return null;
    }

    return loadStripe(stripePublishableKey);
  }, [stripePublishableKey]);

  const options = useMemo(() => {
    if (!embeddedSession || isFetchingEmbeddedSession) {
      return;
    }

    return {
      clientSecret: embeddedSession.client_secret,
    };
  }, [embeddedSession?.client_secret, isFetchingEmbeddedSession]);

  return (
    <div className={`mx-auto max-w-4xl lg:max-w-7xl ${className}`} {...props}>
      <div className='container mx-auto p-4 text-black'>
        {stripePromise && options ? (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}
            key={options.clientSecret}
          >
            <EmbeddedCheckoutWithContext />
          </EmbeddedCheckoutProvider>
        ) : (
          <LoadingSpinner className='text-black' />
        )}
      </div>
    </div>
  );
};

const EmbeddedCheckoutWithContext = () => {
  const { errorMessage } = useHandleCallbacks();

  return (
    <div>
      {errorMessage && (
        <div className='my-4 text-center text-red-500'>{errorMessage}</div>
      )}
      <StripeEmbeddedCheckout />
    </div>
  );
};
