'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateFlexLoanParams = {
  accountId: string;
  stripeSecretKey?: string;
};

export const createFlexLoan = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFlexLoanParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financing offers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: `${STRIPE_API_VERSION}; embedded_connect_beta=v2`,
  });

  const account = await stripe.v2.core.accounts.retrieve(accountId);

  const response = await stripe.rawRequest(
    'POST',
    '/v1/capital/financing_offers/test_mode',
    {
      max_premium_amount: 10000_00,
      max_advance_amount: 100000_00,
      max_withhold_rate_str: 0.15,
      is_refill: false,
      financing_type: 'flex_loan',
      state: 'delivered',
      is_youlend: false,
      is_fixed_term: false,
      'loan_repayment_details[repayment_interval_duration_days]': 60,
      'loan_repayment_details[target_payback_weeks]': 42,
      country: account.identity?.country ?? 'US',
      connected_account: accountId,
    },
  );

  return plain(response);
};
