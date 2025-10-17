'use client';

import { useCart } from '@/context/CartContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useMutation } from '@tanstack/react-query';
import { createHostedCheckoutSession } from '@/app/api/checkout-sessions/createHostedCheckoutSession';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useHandleCallbacks } from '@/components/checkout/HandleCallbacks';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

export const CheckoutButton = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { items, closeCart } = useCart();

  const { id: customerId, email: customerEmail } = useDemoCustomer();

  const { checkoutMethod, currency, stripeSecretKey, language, chargeType } =
    useDemoConfig();

  const { successUrl } = useHandleCallbacks();

  const { account } = useDemoMerchant();

  const {
    mutate: mutateCreateHostedSession,
    isPending: isHostedSessionPending,
    data: hostedSession,
  } = useMutation({
    mutationFn: createHostedCheckoutSession,
    onSuccess: (hostedSession) => {
      if (!hostedSession.url) {
        return;
      }

      router.push(hostedSession.url);
    },
  });

  const redirectToCheckout = () => {
    if (items.length === 0) {
      return;
    }

    if (checkoutMethod === 'stripe-checkout') {
      mutateCreateHostedSession({
        cancelUrl: `${window.location.origin}/${language}/storefront/${account?.id}`,
        successUrl,
        currency,
        customerEmail,
        customerId,
        items,
        language,
        stripeSecretKey,
        chargeType,
        accountId: account!.id,
      });

      return;
    }

    router.push(`/${language}/storefront/${account?.id}/checkout`);
    closeCart();
  };

  return (
    <button
      type='button'
      onClick={redirectToCheckout}
      disabled={
        items.length === 0 ||
        isHostedSessionPending ||
        hostedSession !== undefined
      }
      className='mx-auto px-6 py-4 w-full text-xl font-bold rounded-md bg-brand-secondary text-brand-secondary-contrasting-text hover:bg-brand-secondary-accent disabled:cursor-not-allowed'
    >
      {isHostedSessionPending ? (
        <LoadingSpinner className='text-white w-7 h-7' />
      ) : (
        t('cartPanel.checkoutButton')
      )}
    </button>
  );
};
