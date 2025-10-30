'use server';

import { CurrencyCode } from '@/constants/currencyCodes';
import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type CreateProductParams = {
  name: string;
  description: string | undefined;
  unitAmount: number;
  accountId: string;
  productTaxCode?: string;
  stripeSecretKey?: string;
  currency: CurrencyCode;
  chargeType: DemoConfig['chargeType'];
  imageUrl?: string;
  startTime?: string;
  endTime?: string;
  recurringFrequency: 'week' | 'month' | 'year' | 'day' | undefined;
  category: 'service' | 'good';
};

export const createProduct = async ({
  name,
  description,
  unitAmount,
  accountId,
  productTaxCode,
  chargeType,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  currency,
  imageUrl,
  startTime,
  endTime,
  recurringFrequency,
  category,
}: CreateProductParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create product because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const product = await stripe.products.create(
      {
        name,
        description: description,
        default_price_data: {
          currency,
          unit_amount: unitAmount,
          ...(recurringFrequency
            ? { recurring: { interval: recurringFrequency } }
            : {}),
        },
        tax_code: productTaxCode,

        metadata: {
          accountId,
          ...(category === 'service'
            ? {
                startTime: startTime,
                endTime: endTime,
              }
            : {}),
          category,
        },
        images: imageUrl ? [imageUrl] : undefined,
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
  } catch {
    return {
      message: 'modals.create-product.error',
    };
  }
};
