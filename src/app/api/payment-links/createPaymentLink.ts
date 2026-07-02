'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreatePaymentLinkParams = {
  priceId: string;
  accountId: string;
  chargeType: DemoConfig['chargeType'];
  stripeSecretKey?: string;
};

export const createPaymentLinkAction = async ({
  priceId,
  accountId,
  chargeType,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreatePaymentLinkParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create payment link because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  /**
   * If we're using direct charges, the CA owns the price object.
   * Otherwise, the platform owns the price object.
   */
  const price = await stripe.prices.retrieve(
    priceId,
    {},
    chargeType === 'direct' ? { stripeAccount: accountId } : {},
  );

  const paymentLink = await stripe.paymentLinks.create(
    {
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      ...(chargeType === 'destination' ||
      chargeType === 'destination-on-behalf-of'
        ? {
            transfer_data: {
              destination: accountId,
            },
          }
        : {}),
      ...(chargeType === 'destination-on-behalf-of'
        ? {
            on_behalf_of: accountId,
          }
        : {}),
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(paymentLink);
};
