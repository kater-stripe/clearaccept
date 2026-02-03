'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetPayoutMethodsParams = {
  accountId: string;
  stripeSecretKey?: string;
};

export const getPayoutMethods = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetPayoutMethodsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get payout methods because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: payoutMethods } =
    await stripe.v2.moneyManagement.payoutMethods.list(
      {},
      {
        stripeAccount: accountId,
      },
    );

  return plain(payoutMethods);
};
