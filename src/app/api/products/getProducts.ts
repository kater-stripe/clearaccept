'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetProductsParams = {
  accountId?: string;
  stripeSecretKey?: string;
  limit?: number;
  chargeType?: DemoConfig['chargeType'];
};

export const getProducts = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  limit = 100,
  chargeType,
}: GetProductsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get products because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data } = await stripe.products.list(
    {
      limit,
      active: true,
      expand: ['data.default_price'],
    },
    /**
     * If we're using direct charges, the CA owns the product object.
     * Otherwise, the platform owns the product object.
     */
    accountId && chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  const products = data as (Omit<Stripe.Product, 'default_price'> & {
    default_price: Stripe.Price;
  })[];

  /**
   * When the products are on the platform level (for destination charges), we filter the products to only include
   * the ones that are associated with the currently signed in account (accountId). When we create a product, we
   * always give it the accountId as a metadata field, so this also works when we aren't using destination charges and the
   * products are on the CA level.
   */
  const productsWithAccountId = products.filter(
    (product) => !accountId || product.metadata.accountId === accountId,
  );

  return plain(productsWithAccountId);
};
