'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateTestRiskInterventionParams = {
  accountId: string;
  stripeSecretKey?: string;
};

export const createRiskIntervention = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateTestRiskInterventionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create risk intervention because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const riskInterventionResponse = await stripe.rawRequest(
    'POST',
    '/v1/test_helpers/demo/merchant_issue',
    {
      issue_type: 'additional_info',
      account: accountId,
    },
  );

  return plain(riskInterventionResponse);
};
