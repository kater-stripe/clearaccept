'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetIndirectCustomersByPhoneNumberParams = {
  phoneNumber: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const getIndirectCustomersByPhoneNumber = async ({
  phoneNumber,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: GetIndirectCustomersByPhoneNumberParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get indirect customers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data: customers } = await stripe.customers.list(
    {
      limit: 100,
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  const customersWithMatchingPhoneNumber = customers.filter((customer) => {
    return customer.phone === phoneNumber;
  });

  return plain(customersWithMatchingPhoneNumber);
};
