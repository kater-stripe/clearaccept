'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

// IBAN countries (SEPA zone + other European countries using IBAN)
const IBAN_COUNTRIES = [
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr',
  'de', 'gr', 'hu', 'is', 'ie', 'it', 'lv', 'li', 'lt', 'lu',
  'mt', 'mc', 'nl', 'no', 'pl', 'pt', 'ro', 'sm', 'sk', 'si',
  'es', 'se', 'ch', 'va',
];

type CreateOutboundSetupIntentParams = {
  connectedAccountId: string;
  recipientAccountId: string;
  country: string;
  // Account number (or IBAN for European countries)
  accountNumber?: string;
  // US bank account fields
  routingNumber?: string;
  // GB bank account fields
  sortCode?: string;
  // Common fields
  accountHolderName?: string;
  accountType?: 'checking' | 'savings';
  stripeSecretKey?: string;
};

/**
 * Creates an OutboundSetupIntent to add a payout method for a recipient account.
 * This is the correct approach for Financial Accounts for Platforms (Connect + Treasury).
 * Uses Stripe-Context header with format: {connectedAccountId}/{recipientAccountId}
 * Supports US, GB, and IBAN (European) bank accounts.
 */
export const createOutboundSetupIntent = async ({
  connectedAccountId,
  recipientAccountId,
  country,
  accountNumber,
  routingNumber,
  sortCode,
  accountHolderName,
  accountType = 'checking',
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateOutboundSetupIntentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create outbound setup intent because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Stripe-Context format for FA4P: connectedAccountId/recipientAccountId
  const stripeContextValue = `${connectedAccountId}/${recipientAccountId}`;

  try {
    // Normalize country code for comparison (lowercase) and API (uppercase ISO 3166)
    const countryLower = country.toLowerCase();
    const countryUpper = country.toUpperCase();

    // Build payout method data based on country
    const payoutMethodData: any = {
      type: 'bank_account',
      bank_account: {
        country: countryUpper, // Stripe requires uppercase ISO 3166 alpha-2 code
        account_number: accountNumber,
        bank_account_type: accountType,
      },
    };

    // Add country-specific fields
    if (countryLower === 'us') {
      if (!accountNumber || !routingNumber) {
        throw new Error(
          'Account number and routing number are required for US bank accounts',
        );
      }
      payoutMethodData.bank_account.routing_number = routingNumber;
    } else if (countryLower === 'gb') {
      if (!accountNumber || !sortCode) {
        throw new Error(
          'Account number and sort code are required for GB bank accounts',
        );
      }
      payoutMethodData.bank_account.sort_code = sortCode;

      // GB bank accounts require Confirmation of Payee
      payoutMethodData.bank_account.confirmation_of_payee = {
        business_type: 'personal',
        initiate: true,
        name: accountHolderName || 'Account Holder',
      };
    } else if (IBAN_COUNTRIES.includes(countryLower)) {
      // IBAN countries - the account_number field contains the full IBAN
      if (!accountNumber) {
        throw new Error('IBAN is required for European bank accounts');
      }
      // IBAN already contains all routing information, no additional fields needed
    } else {
      throw new Error(
        `Unsupported country: ${country}. Supported: US, GB, and IBAN countries (EU/SEPA).`,
      );
    }

    // Create payout method via OutboundSetupIntent
    // Use Stripe-Context with format: connectedAccountId/recipientAccountId
    const setupIntent =
      await stripe.v2.moneyManagement.outboundSetupIntents.create(
        {
          payout_method_data: payoutMethodData,
        },
        {
          stripeContext: stripeContextValue,
        },
      );

    // For GB accounts, acknowledge confirmation of payee if needed
    if (
      countryLower === 'gb' &&
      setupIntent.payout_method?.type === 'bank_account' &&
      setupIntent.payout_method.bank_account
    ) {
      const payoutMethodId = setupIntent.payout_method.id;

      try {
        // Acknowledge the CoP result
        await stripe.v2.core.vault.gbBankAccounts.acknowledgeConfirmationOfPayee(
          payoutMethodId,
          {},
          {
            stripeContext: stripeContextValue,
          },
        );
      } catch (ackError) {
        console.warn('Could not acknowledge CoP, continuing anyway', ackError);
      }
    }

    return plain(setupIntent);
  } catch (error) {
    console.error(
      `Unable to create outbound setup intent for recipient ${recipientAccountId}`,
      error,
    );

    return {
      message: 'modals.add-payout-method.error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

