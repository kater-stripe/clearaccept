import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import { type NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';

export type CreateAccountSessionRequestBody = {
  accountId: string;
  stripeSecretKey?: string;
};

export type CreateAccountSessionResponse = Stripe.AccountSession;

const BASE_COMPONENTS: Stripe.AccountSessionCreateParams['components'] = {
  account_onboarding: {
    enabled: true,
    features: {
      disable_stripe_user_authentication: true,
      external_account_collection: true,
    },
  },
  account_management: {
    enabled: true,
    features: {
      disable_stripe_user_authentication: true,
    },
  },
  balances: {
    enabled: true,
    features: {
      disable_stripe_user_authentication: true,
      edit_payout_schedule: true,
      external_account_collection: true,
      instant_payouts: true,
      standard_payouts: true,
    },
  },
  capital_financing: {
    enabled: true,
  },
  capital_financing_application: {
    enabled: true,
  },
  disputes_list: {
    enabled: true,
    features: {
      destination_on_behalf_of_charge_management: true,
    },
  },
  documents: {
    enabled: true,
  },
  notification_banner: {
    enabled: true,
    features: {
      disable_stripe_user_authentication: true,
    },
  },
  payment_details: {
    enabled: true,
    features: {
      destination_on_behalf_of_charge_management: true,
      capture_payments: true,
      refund_management: true,
      dispute_management: true,
    },
  },
  payment_disputes: {
    enabled: true,
    features: {
      destination_on_behalf_of_charge_management: true,
      dispute_management: true,
      refund_management: true,
    },
  },
  payments: {
    enabled: true,
    features: {
      destination_on_behalf_of_charge_management: true,
    },
  },
  payouts: {
    enabled: true,
    features: {
      disable_stripe_user_authentication: true,
      edit_payout_schedule: true,
      external_account_collection: true,
      instant_payouts: true,
      standard_payouts: true,
    },
  },
  payouts_list: {
    enabled: true,
  },
  tax_registrations: {
    enabled: true,
  },
  tax_settings: {
    enabled: true,
  },
};

const TREASURY_COMPONENTS: Stripe.AccountSessionCreateParams['components'] = {
  financial_account: {
    enabled: true,
    features: {
      disable_stripe_user_authentication: true,
      transfer_balance: true,
      send_money: true,
      external_account_collection: true,
    },
  },
  financial_account_transactions: {
    enabled: true,
    features: {
      card_spend_dispute_management: true,
    },
  },
};

// All components at this API version require the embedded_connect_beta=v2 header.
const SESSION_OPTIONS = {
  apiVersion: '2026-06-24.preview;embedded_connect_beta=v2' as const,
};

/**
 * Account session creation works better with Next.js when it's done via. an API route instead of a server action.
 * That's why this file looks a little different and instead of directly calling the server action, we have to make a call to
 * the POST `/api/accounts/account-session` route directly.
 */
export const POST = async (request: NextRequest) => {
  try {
    const { accountId, stripeSecretKey = process.env.STRIPE_SECRET_KEY } =
      (await request.json()) as CreateAccountSessionRequestBody;

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            'Unable to create account session because no account ID was provided.',
        },
        { status: 400 },
      );
    }

    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          error:
            'Unable to create account session because neither a secret key was provided nor one was found in the environment variables.',
        },
        { status: 500 },
      );
    }

    const stripe = initializeStripe(stripeSecretKey);

    // Tier 1: full components including treasury.
    // Tier 2: base only if the account lacks the treasury capability.
    // Tier 3: minimal features if the platform doesn't support disable_stripe_user_authentication.
    let accountSession: Stripe.AccountSession;
    try {
      accountSession = await stripe.accountSessions.create(
        {
          account: accountId,
          components: { ...BASE_COMPONENTS, ...TREASURY_COMPONENTS },
        },
        SESSION_OPTIONS,
      );
    } catch (err) {
      if (
        !(err instanceof Stripe.errors.StripeInvalidRequestError) ||
        (!err.message.includes('treasury capability') &&
          !err.message.includes('financial_account'))
      ) {
        throw err;
      }
      // Tier 2: account lacks treasury.
      try {
        accountSession = await stripe.accountSessions.create(
          { account: accountId, components: BASE_COMPONENTS },
          SESSION_OPTIONS,
        );
      } catch (err2) {
        if (
          !(err2 instanceof Stripe.errors.StripeInvalidRequestError) ||
          !err2.message.includes('disable_stripe_user_authentication')
        ) {
          throw err2;
        }
        // Tier 3: platform doesn't support disable_stripe_user_authentication.
        const minimalComponents: Stripe.AccountSessionCreateParams['components'] =
          {
            account_onboarding: { enabled: true },
            account_management: { enabled: true },
            balances: { enabled: true },
            capital_financing: { enabled: true },
            capital_financing_application: { enabled: true },
            disputes_list: { enabled: true },
            documents: { enabled: true },
            notification_banner: { enabled: true },
            payment_details: { enabled: true },
            payment_disputes: { enabled: true },
            payments: { enabled: true },
            payouts: { enabled: true },
            payouts_list: { enabled: true },
            tax_registrations: { enabled: true },
            tax_settings: { enabled: true },
          };
        accountSession = await stripe.accountSessions.create(
          { account: accountId, components: minimalComponents },
          SESSION_OPTIONS,
        );
      }
    }

    return NextResponse.json(
      plain(accountSession) satisfies CreateAccountSessionResponse,
    );
  } catch (error) {
    console.error('[account-session]', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to create account session.';

    const status =
      error instanceof Stripe.errors.StripeError
        ? (error.statusCode ?? 500)
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
};
