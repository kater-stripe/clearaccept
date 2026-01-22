'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import type Stripe from 'stripe';

type CreateTerminalLocationParams = {
  display_name: string;
  accountId: string;
  chargeType: DemoConfig['chargeType'];
  stripeSecretKey?: string;
  address: {
    city: string;
    country: string;
    line1: string;
    line2?: string;
    postal_code: string;
    state: string;
  };
};

export const createTerminalLocation = async ({
  accountId,
  display_name,
  chargeType,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  address,
}: CreateTerminalLocationParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create terminal location because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  let configurationId: string | undefined = undefined;

  /**
   * If we're not using direct charges, the platform owns the terminal location.
   * As a result, we create a configuration for the account so we can manage the splash screens, tipping, etc. on the platform.
   *
   * See https://docs.stripe.com/terminal/design-multiparty-platform#standard-connect for more information.
   */
  if (chargeType !== 'direct') {
    const { data: configurations } = await stripe.terminal.configurations.list({
      limit: 100,
    });

    let configuration: Stripe.Terminal.Configuration | undefined =
      configurations.find((configuration) => configuration.name === accountId);

    if (!configuration) {
      configuration = await stripe.terminal.configurations.create({
        name: accountId,
      });
    }

    configurationId = configuration.id;
  }

  const location = await stripe.terminal.locations.create(
    {
      configuration_overrides: configurationId,
      display_name,
      address,
      metadata: {
        accountId,
      },
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(location);
};
