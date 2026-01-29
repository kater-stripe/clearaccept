'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import type { CountryCode } from '@demoeng/utils/countries';
import type { Language } from '@demoeng/utils/languages';
import { Mock } from '@demoeng/utils/mock';

type SeedIssuingParams = {
  seedCardholders: boolean;
  seedCards: boolean;
  seedCaptures: boolean;
  seedRefunds: boolean;
  accountId: string;
  language: Language;
  stripeSecretKey?: string;
};

export const seedIssuing = async ({
  seedCardholders,
  seedCards,
  seedCaptures,
  seedRefunds,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  language,
}: SeedIssuingParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to seed issuing because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const account = await stripe.v2.core.accounts.retrieve(accountId);

  try {
    if (seedCardholders === undefined) {
      return {
        message: 'No seeding options selected',
      };
    }

    const country = (account.identity?.country?.toUpperCase() ?? 'US') as CountryCode;

    const mock = new Mock({
      country,
      language: language,
      validForConnect: false,
    });

    for (let i = 0; i < 5; i++) {
      const { address, address_kana } = mock.addresses();

      const individualNames = mock.individualNames();

      const dob = mock.dateOfBirth();

      const cardholder = await stripe.issuing.cardholders.create(
        {
          billing: {
            address: {
              city: address?.city! || address_kana?.city!,
              country,
              line1: address?.line1! || address_kana?.line1!,
              postal_code: address?.postal_code! || address_kana?.postal_code!,
              state: address?.state! || address_kana?.state!,
            },
          },
          phone_number: mock.phoneNumber(),
          individual: {
            first_name: individualNames.first_name,
            last_name: individualNames.last_name,
            dob,
            card_issuing: {
              user_terms_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: '127.0.0.1',
              },
            },
          },
          name: `${individualNames.name}`.slice(0, 24),
          email: mock.email({
            individualNames,
          }),
          type: 'individual',
          status: 'active',
        },
        {
          stripeAccount: accountId,
        },
      );

      if (seedCards) {
        const card = await stripe.issuing.cards.create(
          {
            cardholder: cardholder.id,
            type: 'virtual',
            currency: account.defaults?.currency ?? 'usd',
            status: 'active',
          },
          {
            stripeAccount: accountId,
          },
        );

        for (let i = 0; i < 5; i++) {
          const companyNames = mock.companyNames();

          if (seedCaptures) {
            const capture =
              await stripe.testHelpers.issuing.transactions.createForceCapture(
                {
                  amount: mock.integer({
                    min: 5000,
                    max: 50000,
                  }),
                  card: card.id,
                  merchant_data: {
                    name: companyNames.name || companyNames.name_kana,
                  },
                },
                {
                  stripeAccount: accountId,
                },
              );

            if (seedRefunds) {
              // 10% chance of refund
              if (mock.integer({ min: 0, max: 10 }) === 1) {
                await stripe.testHelpers.issuing.transactions.refund(
                  capture.id,
                  {
                    stripeAccount: accountId,
                  },
                );
              }
            }
          }
        }
      }
    }

    return null;
  } catch (error: unknown) {
    console.error(error);

    return {
      error: 'An error occurred when calling the Stripe API to seed issuing',
    };
  }
};
