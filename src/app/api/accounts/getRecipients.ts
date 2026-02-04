'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetRecipientsParams = {
  accountId: string;
  stripeSecretKey?: string;
};

/**
 * Returns recipient accounts that belong to the connected account (logged-in merchant).
 * Accounts are filtered by metadata.accountId matching the accountId.
 */
export const getRecipients = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetRecipientsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get recipients because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Search for customers with metadata.accountId matching the connected account
  // Since v2 accounts also have a customer representation, we can search customers
  const { data: customers } = await stripe.customers.search({
    query: `metadata["accountId"]:"${accountId}"`,
    limit: 100,
  });

  // Fetch the full v2 account details for each matching customer
  const accounts = await Promise.all(
    customers.map(async (customer) => {
      try {
        const account = await stripe.v2.core.accounts.retrieve(customer.id, {
          include: ['identity', 'configuration.merchant'],
        });
        return plain(account);
      } catch {
        // Account might not exist or be inaccessible
        return null;
      }
    }),
  );

  // Filter out nulls and return valid accounts
  return accounts.filter((account) => account !== null);
};

