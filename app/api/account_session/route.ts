import {type NextRequest} from 'next/server';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {stripe} from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const json = await req.json();

    const {demoOnboarding, locale} = json;

    let stripeAccountId = session?.user?.stripeAccount?.id;

    if (demoOnboarding !== undefined) {
      const accountId: string = (() => {
        switch (locale) {
          case 'fr-FR':
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_FR!;
          case 'en-SG':
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_SG!;
          case 'en-AU':
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_AU!;
          case 'en-GB':
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_GB!;
          case 'en-HK':
          case 'zh-Hant-HK':
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_HK!;
          case 'en-US':
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_US!;
          default:
            // Default
            return process.env.EXAMPLE_DEMO_ONBOARDING_ACCOUNT_DEFAULT!;
        }
      })();

      console.log(
        `Looking for the demo onboarding account ${accountId} for locale ${locale}`
      );
      const demoOnboardingAccount = await stripe.accounts.retrieve(accountId);
      if (demoOnboardingAccount) {
        console.log(
          `Using demo onboarding account: ${demoOnboardingAccount.id}`
        );
        stripeAccountId = demoOnboardingAccount.id;
      } else {
        console.log('No demo onboarding account found');
      }
    }

    if (!stripeAccountId) {
      return new Response(
        JSON.stringify({
          error: 'No Stripe account found for this user',
        }),
        {status: 400}
      );
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);
    const inbComponents =
      account.capabilities?.treasury !== undefined
        ? {
            financial_account: {
              enabled: true,
              // features: {
              //   money_movement: true,
              //   external_account_collection: false,
              // },
            },
            financial_account_transactions: {
              enabled: true,
              // features: {
              //   card_spend_dispute_management: true,
              // },
            },
          }
        : {};

    const issuingComponents =
      account.capabilities?.card_issuing !== undefined
        ? {
            issuing_cards_list: {
              enabled: true,
              // features: {
              //   card_management: true,
              //   cardholder_management: true,
              //   card_spend_dispute_management: true,
              // },
            },
          }
        : {};

    const components = {
      // Payments
      payments: {
        enabled: true,
      },
      payouts: {
        enabled: true,
        // features: {
        //   instant_payouts: true,
        //   standard_payouts: true,
        //   edit_payout_schedule: true,
        //   external_account_collection: false,
        // },
      },
      // Connect
      // @ts-ignore
      account_management: {
        enabled: true,
        // features: {
        //   external_account_collection: false,
        // },
      },
      account_onboarding: {
        enabled: true,
        // features: {
        //   external_account_collection: false,
        // },
      },
      // payment_method_settings & capital_overview are beta options and need to be enabled before you can use them
      // -- https://trailhead.corp.stripe.com/docs/connect-tfc/accounts-and-onboarding/connect-embedded-components
      payment_method_settings: {enabled: true},
      // InB
      capital_overview: {
        enabled: true,
      },
      ...issuingComponents,
      ...inbComponents,
    };

    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: components,
    });

    return new Response(
      JSON.stringify({
        client_secret: accountSession.client_secret,
      }),
      {status: 200, headers: {'Content-Type': 'application/json'}}
    );
  } catch (error: any) {
    console.error(
      'An error occurred when calling the Stripe API to create an account session',
      error
    );
    return new Response(JSON.stringify({error: error.message}), {status: 500});
  }
}
