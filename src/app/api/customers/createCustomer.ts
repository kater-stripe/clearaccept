'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type CreateCustomerParams = {
  email: string;
  phone: string;
  name: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const createCustomer = async ({
  email,
  phone,
  name,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: CreateCustomerParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create customer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const customer = await stripe.customers.create(
    {
      email,
      phone,
      name,
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  return plain(customer);
};
