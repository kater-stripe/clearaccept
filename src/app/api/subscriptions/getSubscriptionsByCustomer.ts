'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetSubscriptionsByCustomerParams = {
  stripeSecretKey?: string;
  customerId: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const getSubscriptionsByCustomer = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  chargeType,
  accountId,
}: GetSubscriptionsByCustomerParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get subscriptions because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const maxRetries = 3 as const;
  let retries = 0;

  do {
    try {
      const { data } = await stripe.subscriptions.list(
        {
          customer: customerId,
        },
        chargeType === 'direct'
          ? {
              stripeAccount: accountId,
            }
          : undefined,
      );

      const subscriptionsWithExpandedProduct = await Promise.all(
        data.map(async (subscription) => {
          const items = await Promise.all(
            subscription.items.data.map(async (item) => {
              const product = await stripe.products.retrieve(
                item.price.product as string,
                chargeType === 'direct'
                  ? {
                      stripeAccount: accountId,
                    }
                  : undefined,
              );

              return {
                ...item,
                price: {
                  ...item.price,
                  product,
                },
              };
            }),
          );

          return {
            ...subscription,
            items: {
              ...subscription.items,
              data: items,
            },
          };
        }),
      );

      return plain(subscriptionsWithExpandedProduct);
    } catch {
      retries++;
    }
  } while (retries < maxRetries);

  throw new Error(
    'Failed to get customer subscriptions, likely because the customer id is invalid or the customer was recently created.',
  );
};
