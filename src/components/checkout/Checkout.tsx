'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { EmbeddedCheckout } from '@/components/checkout/EmbeddedCheckout';
import { HostedCheckout } from '@/components/checkout/HostedCheckout';
import { ElementsCheckout } from '@/components/checkout/ElementsCheckout';
import { ElementsCheckoutWithPaymentIntents } from '@/components/checkout/ElementsCheckoutWithPaymentIntents';
import { ElementsCheckoutWithCheckoutSessions } from '@/components/checkout/ElementsCheckoutWithCheckoutSessions';
import type { StripeCheckoutShippingOption } from '@stripe/stripe-js';

type CheckoutProps = {
  shippingOptionsOverride?: StripeCheckoutShippingOption[];
};

export const Checkout = ({ shippingOptionsOverride }: CheckoutProps) => {
  const { checkoutMethod } = useDemoConfig();

  if (checkoutMethod === 'elements-checkout') {
    return (
      <ElementsCheckoutWithPaymentIntents
        shippingOptionsOverride={shippingOptionsOverride}
      >
        <ElementsCheckout />
      </ElementsCheckoutWithPaymentIntents>
    );
  }

  if (checkoutMethod === 'elements-checkout-with-checkout-sessions') {
    return (
      <ElementsCheckoutWithCheckoutSessions
        shippingOptionsOverride={shippingOptionsOverride}
      >
        <ElementsCheckout />
      </ElementsCheckoutWithCheckoutSessions>
    );
  }

  if (checkoutMethod === 'embedded-checkout') {
    return <EmbeddedCheckout />;
  }

  if (checkoutMethod === 'stripe-checkout') {
    return <HostedCheckout />;
  }

  return null;
};
