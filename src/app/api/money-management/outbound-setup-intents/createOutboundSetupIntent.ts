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

    // Derive currency from country
    let currency: string;
    if (countryLower === 'gb') {
      currency = 'gbp';
    } else if (IBAN_COUNTRIES.includes(countryLower)) {
      currency = 'eur';
    } else {
      currency = 'usd';
    }

    // Validate required fields per country
    if (countryLower === 'us' && (!accountNumber || !routingNumber)) {
      throw new Error('Account number and routing number are required for US bank accounts');
    }
    if (countryLower === 'gb' && (!accountNumber || !sortCode)) {
      throw new Error('Account number and sort code are required for GB bank accounts');
    }
    if (IBAN_COUNTRIES.includes(countryLower) && !accountNumber) {
      throw new Error('IBAN is required for European bank accounts');
    }
    if (!['us', 'gb', ...IBAN_COUNTRIES].includes(countryLower)) {
      throw new Error(`Unsupported country: ${country}`);
    }

    // Build payout_method_data.bank_account — v2 API shape:
    // GB: branch_number = sort code (NOT sort_code), no confirmation_of_payee field
    // US: routing_number
    // IBAN: account_number contains the full IBAN
    const bankAccount: Record<string, string> = {
      account_number: accountNumber!,
      country: countryUpper,
      currency,
    };
    if (countryLower === 'us') {
      bankAccount.routing_number = routingNumber!;
    }
    if (countryLower === 'gb') {
      bankAccount.routing_number = sortCode!; // GB sort code is passed as routing_number in OSI
    }

    const setupIntent =
      await stripe.v2.moneyManagement.outboundSetupIntents.create(
        {
          payout_method_data: {
            type: 'bank_account',
            bank_account: bankAccount as any,
          },
          usage_intent: 'payment',
        },
        {
          stripeContext: stripeContextValue,
        },
      );

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

