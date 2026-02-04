'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type MerchantCountry = 'US' | 'GB';

type CreateCapitalOfferParams = {
  accountId: string;
  country: MerchantCountry;
  stripeSecretKey?: string;
};

/**
 * Country-specific configuration for capital offers.
 *
 * US: Stripe Capital flex loan
 * GB: YouLend cash advance (financing partner for UK)
 */
const COUNTRY_CONFIG: Record<
  MerchantCountry,
  {
    financingType: 'flex_loan' | 'cash_advance';
    isYoulend: boolean;
  }
> = {
  US: {
    financingType: 'flex_loan',
    isYoulend: false,
  },
  GB: {
    financingType: 'cash_advance',
    isYoulend: true,
  },
};

/**
 * Creates a capital financing offer based on merchant country.
 *
 * - US merchants: Stripe Capital flex loan (is_youlend: false)
 * - GB merchants: YouLend cash advance (is_youlend: true)
 */
export const createCapitalOffer = async ({
  accountId,
  country,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateCapitalOfferParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financing offer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const config = COUNTRY_CONFIG[country];

  const stripe = initializeStripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: `${STRIPE_API_VERSION}; embedded_connect_beta=v2`,
  });

  const response = await stripe.rawRequest(
    'POST',
    '/v1/capital/financing_offers/test_mode',
    {
      max_premium_amount: 10000_00,
      max_advance_amount: 100000_00,
      max_withhold_rate_str: 0.15,
      is_refill: false,
      financing_type: config.financingType,
      state: 'delivered',
      is_youlend: config.isYoulend,
      is_fixed_term: false,
      'loan_repayment_details[repayment_interval_duration_days]': 60,
      'loan_repayment_details[target_payback_weeks]': 42,
      country,
      connected_account: accountId,
    },
  );

  return plain(response);
};

