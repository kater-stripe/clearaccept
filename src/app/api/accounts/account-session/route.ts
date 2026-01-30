'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import { type NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';

export type CreateAccountSessionRequestBody = {
  accountId: string;
  stripeSecretKey?: string;
};

export type CreateAccountSessionResponse = Stripe.AccountSession;

/**
 * Account session creation works better with Next.js when it's done via. an API route instead of a server action.
 * That's why this file looks a little different and instead of directly calling the server action, we have to make a call to
 * the POST `/api/accounts/account-session` route directly.
 */
export const POST = async (request: NextRequest) => {
  const { accountId, stripeSecretKey = process.env.STRIPE_SECRET_KEY } =
    (await request.json()) as CreateAccountSessionRequestBody;

  if (!accountId) {
    throw new Error(
      'Unable to create account session because no account ID was provided.',
    );
  }

  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create account session because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // @ts-expect-error
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: [
      'defaults',
      'configuration.customer',
      'configuration.merchant',
      'configuration.recipient',
      'configuration.storer',
      'configuration.card_creator',
    ],
  });

  const accountSession = await stripe.accountSessions.create(
    {
      account: accountId,
      components: {
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
        capital_financing_promotion: {
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
        export_tax_transactions: {
          enabled: true,
        },
        instant_payouts_promotion: {
          enabled: true,
          features: {
            disable_stripe_user_authentication: true,
            instant_payouts: true,
          },
        },
        // ...(Object.entries(account.configuration?.storer?.capabilities?.holds_currencies ?? {}).some(([_currency, capability]) => capability?.status === 'active')
        //   ? {
        //       financial_account: {
        //         enabled: true,
        //         features: {
        //           disable_stripe_user_authentication: true,
        //           transfer_balance: true,
        //           send_money: true,
        //           external_account_collection: true,
        //         },
        //       },
        //       financial_account_transactions: {
        //         enabled: true,
        //         features: {
        //           card_spend_dispute_management: true,
        //         },
        //       },
        //     }
        //   : {}),
        // @ts-expect-error
        ...(account.configuration?.card_creator?.capabilities?.commercial
          ?.stripe?.charge_card?.status === 'active'
          ? {
              issuing_card: {
                enabled: true,
                features: {
                  card_management: true,
                  cardholder_management: true,
                  card_spend_dispute_management: true,
                  spend_control_management: true,
                },
              },
              issuing_cards_list: {
                enabled: true,
                features: {
                  disable_stripe_user_authentication: true,
                  card_management: true,
                  cardholder_management: true,
                  card_spend_dispute_management: true,
                  spend_control_management: true,
                },
              },
            }
          : {}),
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
        payment_method_settings: {
          enabled: true,
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
        product_tax_code_selector: {
          enabled: true,
        },
        // recipients: {
        //   enabled: true,
        // },
        tax_registrations: {
          enabled: true,
        },
        tax_settings: {
          enabled: true,
        },
        tax_threshold_monitoring: {
          enabled: true,
        },
        reporting_chart: {
          enabled: true,
        },
        app_install: {
          enabled: true,
          features: {
            allowed_apps: ['com.example.acodeistripeapp', 'com.xero.stripeapp'],
          },
        },
        app_viewport: {
          enabled: true,
          features: {
            allowed_apps: ['com.example.acodeistripeapp', 'com.xero.stripeapp'],
          },
        },
      },
    },
    {
      apiVersion: '2025-12-15.preview;embedded_connect_beta=v2',
    },
  );

  return NextResponse.json(
    plain(accountSession) satisfies CreateAccountSessionResponse,
  );
};
