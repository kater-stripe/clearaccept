'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetCustomersParams = {
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  limit?: number;
};

export const getCustomers = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  limit = 100,
}: GetCustomersParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get customers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: customers } = await stripe.customers.list(
    {
      limit,
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  /**
   * Filter customers to only include ones associated with the current account
   * when not using direct charges.
   */
  const filteredCustomers = customers.filter(
    (customer) =>
      chargeType === 'direct' || customer.metadata?.accountId === accountId,
  );

  return plain(filteredCustomers);
};
