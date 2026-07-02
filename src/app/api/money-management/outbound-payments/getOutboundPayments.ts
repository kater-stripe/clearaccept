'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetOutboundPaymentsParams = {
  accountId: string;
  financialAccountId?: string;
  limit?: number;
  stripeSecretKey?: string;
};

export const getOutboundPayments = async ({
  accountId,
  financialAccountId,
  limit = 50,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetOutboundPaymentsParams) => {
  if (!stripeSecretKey) {
    throw new Error('No Stripe secret key provided');
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: payments } = await stripe.v2.moneyManagement.outboundPayments.list(
    { limit },
    { stripeContext: accountId },
  );

  return plain(payments);
};
