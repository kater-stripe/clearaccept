'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CollectPhoneNumberParams = {
  readerId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  customText: {
    title: string;
    description: string;
  };
};

export const collectPhoneNumber = async ({
  readerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
  customText,
}: CollectPhoneNumberParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to collect phone number because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const reader = await stripe.terminal.readers.collectInputs(
    readerId,
    {
      inputs: [
        {
          type: 'phone',
          custom_text: customText,
        },
      ],
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  return plain(reader);
};
