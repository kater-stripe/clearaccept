'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetAuthorizationsParams = {
  accountId: string;
  limit?: number;
  status?: 'pending' | 'closed' | 'reversed';
  stripeSecretKey?: string;
};

export const getAuthorizations = async ({
  accountId,
  limit = 100,
  status,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetAuthorizationsParams) => {
  if (!stripeSecretKey) {
    throw new Error('No Stripe secret key provided');
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: authorizations } = await stripe.issuing.authorizations.list(
    { limit, ...(status ? { status } : {}) },
    { stripeContext: accountId },
  );

  return plain(authorizations);
};
