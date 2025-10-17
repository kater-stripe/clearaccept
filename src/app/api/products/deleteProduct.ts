'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type DeleteProductParams = {
  productId: string;
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const deleteProduct = async ({
  productId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: DeleteProductParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to delete product because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const product = await stripe.products.update(
    productId,
    {
      active: false,
    },
    /**
     * If we're using direct charges, the CA owns the product object.
     * Otherwise, the platform owns the product object.
     */
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(product);
};
