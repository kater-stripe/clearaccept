'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import { CountryCode as MockCountryCode } from '@demoeng/utils/countries';
import { Mock } from '@demoeng/utils/mock';
import type Stripe from 'stripe';

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
    // Initialize mock data generator for prefilling required fields
    const mock = new Mock({
      language: 'en',
      country: country.toUpperCase() as MockCountryCode,
      validForConnect: true,
    });

    const addresses = mock.addresses();
    const mockAddress = addresses.address
      ? {
          ...addresses.address,
          country: addresses.address.country.toLowerCase(),
        }
      : {
          ...addresses.address_kana,
          country: addresses.address_kana!.country.toLowerCase(),
        };

    // Build identity based on entity type
    // Country must be uppercase ISO 3166 alpha-2 code
    let displayName: string;
    let identity: Stripe.V2.Core.AccountCreateParams.Identity;

    if (entityType === 'individual') {
      if (!givenName || !surname) {
        throw new Error('Given name and surname are required for individuals');
      }
      // Prefill individual with address, phone, and DOB for validation
      identity = {
        country: country.toUpperCase(),
        entity_type: 'individual',
        individual: {
          given_name: givenName,
          surname: surname,
          address: mockAddress,
          phone: mock.phoneNumber(),
          date_of_birth: {
            day: 1,
            month: 1,
            year: 1901,
          },
        },
      };
      displayName = `${givenName} ${surname}`;
    } else {
      if (!registeredName) {
        throw new Error('Registered name is required for companies');
      }
      // Prefill business details with address and phone for validation
      identity = {
        country: country.toUpperCase(),
        entity_type: 'company',
        business_details: {
          registered_name: registeredName,
          address: mockAddress,
          phone: mock.phoneNumber(),
        },
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
          recipient: {
            capabilities: {
              bank_accounts: {
                local: {
                  requested: true,
                },
                wire: {
                  requested: true,
                },
              },
            },
          },
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
