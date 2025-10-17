'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import type { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type CollectPaymentMethodParams = {
  readerId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  currency: CurrencyCode;
  items: Item[];
  tax: number;
  total: number;
  customerId?: string | null;
  taxCalculationId?: string | null;
};

export const collectPaymentMethod = async ({
  readerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
  currency,
  total,
  customerId,
  taxCalculationId,
  items,
}: CollectPaymentMethodParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to collect payment method because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const hasSubscriptionInCart = items.some(
    (item) => item.price.recurring !== null,
  );

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: total,
      currency,
      capture_method: 'automatic',
      payment_method_types: ['card_present'],
      customer: customerId ?? undefined,
      ...(hasSubscriptionInCart && customerId
        ? {
            setup_future_usage: 'off_session',
          }
        : {}),
      ...(taxCalculationId
        ? {
            hooks: {
              inputs: {
                tax: {
                  calculation: taxCalculationId,
                },
              },
            },
          }
        : {}),
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  const reader = await stripe.terminal.readers.collectPaymentMethod(
    readerId,
    {
      payment_intent: paymentIntent.id,
      ...(hasSubscriptionInCart && customerId
        ? {
            collect_config: {
              allow_redisplay: 'always',
            },
          }
        : {}),
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain({
    reader,
    paymentIntent,
  });
};
