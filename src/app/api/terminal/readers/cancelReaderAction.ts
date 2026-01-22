'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CancelReaderActionParams = {
  readerId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const cancelReaderAction = async ({
  readerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: CancelReaderActionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to cancel reader action because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const reader = await stripe.terminal.readers.cancelAction(
    readerId,
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(reader);
};
