'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetLocationsParams = {
  stripeSecretKey?: string;
  accountId: string;
  chargeType: DemoConfig['chargeType'];
};

export const getLocations = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  accountId,
  chargeType,
}: GetLocationsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to retrieve terminal locations because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: locations } = await stripe.terminal.locations.list(
    /**
     * If we are using direct charges, we get the locations on the CA.
     * Otherwise, we get the locations on the platform.
     *
     * See https://docs.stripe.com/terminal/design-multiparty-platform#standard-connect for more information.
     */
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  /**
   * When the locations are on the platform level (for destination charges), we filter the locations to only include
   * the ones that are associated with the currently signed in account (accountId). When we create a location, we
   * always give it the accountId as a metadata field, so this also works when we aren't using destination charges and the
   * locations are on the CA level.
   */
  const locationsWithAccountId = locations.filter(
    (location) => location.metadata.accountId === accountId,
  );

  return plain(locationsWithAccountId);
};
