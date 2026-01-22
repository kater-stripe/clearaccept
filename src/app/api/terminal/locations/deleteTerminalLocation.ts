'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type DeleteTerminalLocationParams = {
  stripeSecretKey?: string;
  locationId: string;
  accountId: string;
  chargeType: DemoConfig['chargeType'];
};

export const deleteTerminalLocation = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  accountId,
  chargeType,
  locationId,
}: DeleteTerminalLocationParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create terminal location because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  /**
   * If we are using direct charges, we delete the readers and location on the CA.
   * Otherwise, we delete the readers and location on the platform.
   *
   * See https://docs.stripe.com/terminal/design-multiparty-platform#standard-connect for more information.
   */

  const { data: readers } = await stripe.terminal.readers.list(
    {
      location: locationId,
      limit: 100,
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  for (const reader of readers) {
    try {
      await stripe.terminal.readers.del(
        reader.id,
        chargeType === 'direct'
          ? {
              stripeAccount: accountId,
            }
          : undefined,
      );
    } catch (error) {
      console.error(
        `Unable to delete reader ${reader.id} from location ${locationId}`,
      );
    }
  }

  const deletedLocation = await stripe.terminal.locations.del(
    locationId,
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(deletedLocation);
};
