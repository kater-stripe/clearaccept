'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetIndirectCustomersByEmailParams = {
  email: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const getIndirectCustomersByEmail = async ({
  email,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: GetIndirectCustomersByEmailParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get indirect customers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: customersWithMatchingEmail } = await stripe.customers.list(
    {
      email,
      limit: 100,
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  return plain(customersWithMatchingEmail);
};
