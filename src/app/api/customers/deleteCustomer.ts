'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type DeleteCustomerParams = {
  customerId: string;
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const deleteCustomer = async ({
  customerId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: DeleteCustomerParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to delete customer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const deleted = await stripe.customers.del(
    customerId,
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  return plain(deleted);
};
