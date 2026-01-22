'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type DeleteReaderParams = {
  readerId: string;
  accountId: string;
  chargeType: DemoConfig['chargeType'];
  stripeSecretKey?: string;
};

export const deleteReader = async ({
  readerId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: DeleteReaderParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to delete terminal reader because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const deletedReader = await stripe.terminal.readers.del(
    readerId,
    /**
     * If we are using direct charges, we delete the reader on the CA.
     * Otherwise, we delete the reader on the platform.
     *
     * See https://docs.stripe.com/terminal/design-multiparty-platform#standard-connect for more information.
     */
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(deletedReader);
};
