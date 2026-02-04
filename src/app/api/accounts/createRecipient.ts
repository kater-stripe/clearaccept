'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateRecipientParams = {
  connectedAccountId: string;
  contactEmail: string;
  entityType: 'individual' | 'company';
  country: string;
  // For individuals
  givenName?: string;
  surname?: string;
  // For companies
  registeredName?: string;
  stripeSecretKey?: string;
};

/**
 * Creates a new recipient account scoped to a specific connected account.
 * Uses Stripe-Context header to associate the recipient with the connected account.
 * This follows the FA4P (Financial Accounts for Platforms) pattern.
 */
export const createRecipient = async ({
  connectedAccountId,
  contactEmail,
  entityType,
  country,
  givenName,
  surname,
  registeredName,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateRecipientParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create recipient because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    // Build identity based on entity type
    // Country must be uppercase ISO 3166 alpha-2 code
    const identity: any = {
      country: country.toUpperCase(),
      entity_type: entityType,
    };

    // Generate display name based on entity type
    let displayName: string;

    if (entityType === 'individual') {
      if (!givenName || !surname) {
        throw new Error('Given name and surname are required for individuals');
      }
      identity.individual = {
        given_name: givenName,
        surname: surname,
      };
      displayName = `${givenName} ${surname}`;
    } else {
      if (!registeredName) {
        throw new Error('Registered name is required for companies');
      }
      identity.business_details = {
        registered_name: registeredName,
      };
      displayName = registeredName;
    }

    // Create a v2 account scoped to the connected account using Stripe-Context.
    // This makes the recipient "owned by" the connected account, so only that CA can pay them.
    // For FA4P (Connect + Treasury), we configure the account as a "customer" which allows
    // it to be used as a recipient for outbound payments. The customer configuration is
    // the v2 representation of a v1 Customer object.
    const account = await stripe.v2.core.accounts.create(
      {
        contact_email: contactEmail,
        display_name: displayName,
        identity,
        configuration: {
          customer: {},
        },
        include: ['identity', 'configuration.customer'],
      },
      {
        // Stripe-Context header scopes this recipient to the connected account
        stripeContext: connectedAccountId,
      },
    );

    return plain(account);
  } catch (error) {
    console.error(
      `Unable to create recipient account for connected account ${connectedAccountId}`,
      error,
    );

    return {
      message: 'modals.add-recipient.error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

