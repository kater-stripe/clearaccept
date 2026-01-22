'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreatedHostedOnboardingLinkParams = {
  accountId: string;
  returnRefreshUrl: string;
  onboardCollectionFields: DemoConfig['onboardCollectionFields'];
  stripeSecretKey?: string;
};

export const createHostedOnboardingLink = async ({
  accountId,
  returnRefreshUrl,
  onboardCollectionFields,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreatedHostedOnboardingLinkParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create hosted onboarding link because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const accountHostedOnboardingLink = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: returnRefreshUrl,
    return_url: returnRefreshUrl,
    collection_options: {
      fields: onboardCollectionFields,
      future_requirements: 'include',
    },
  });

  return plain(accountHostedOnboardingLink);
};
