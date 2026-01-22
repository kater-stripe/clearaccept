'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetPaymentIntentByIdParams = {
  id: string;
  clientSecret: string;
  stripePublishableKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const getPaymentIntentById = async ({
  id,
  clientSecret,
  stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY,
  chargeType,
  accountId,
}: GetPaymentIntentByIdParams) => {
  if (!stripePublishableKey) {
    throw new Error(
      'Unable to get payment intent because a publishable key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripePublishableKey);

  const paymentIntent = await stripe.paymentIntents.retrieve(
    id,
    {
      client_secret: clientSecret,
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(paymentIntent);
};
