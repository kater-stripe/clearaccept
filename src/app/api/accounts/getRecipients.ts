'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetRecipientsParams = {
  connectedAccountId: string;
  stripeSecretKey?: string;
};

/**
 * Returns recipient accounts that belong to the connected account.
 * Uses Stripe-Context header to scope the search to the connected account's recipients.
 * This follows the FA4P (Financial Accounts for Platforms) pattern.
 */
export const getRecipients = async ({
  connectedAccountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetRecipientsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get recipients because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const { data: accounts } = await stripe.v2.core.accounts.list(
      {
        applied_configurations: ['recipient'],
      },
      {
        stripeContext: connectedAccountId,
      },
    );

    // Return accounts with identity details
    const accountsWithIdentity = await Promise.all(
      accounts.map(async (account) => {
        try {
          const fullAccount = await stripe.v2.core.accounts.retrieve(
            account.id,
            {
              include: ['identity'],
            },
            {
              stripeContext: connectedAccountId,
            },
          );
          return plain(fullAccount);
        } catch {
          // Return the basic account if we can't get full details
          return plain(account);
        }
      }),
    );

    return accountsWithIdentity;
  } catch (error) {
    console.error(
      `Unable to get recipients for connected account ${connectedAccountId}`,
      error,
    );
    return [];
  }
};
