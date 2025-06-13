import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {NextRequest} from 'next/server';
import * as fakerLocales from '@faker-js/faker';

export async function POST(request: NextRequest) {
  const stripe = initializeStripe(request.headers);

  try {
    const session = await getServerSession(authOptions);

    const {seedCardholders, seedCards, seedCaptures, seedRefunds} =
      await request.json();

    if (seedCardholders === undefined) {
      return new Response('No seeding options selected', {status: 400});
    }

    const connectedAccount = session?.user?.stripeAccount;

    if (!connectedAccount) {
      return new Response('No connected account found on the user', {
        status: 400,
      });
    }

    const faker =
      (fakerLocales[
        `fakerEN_${connectedAccount.country}` as keyof typeof fakerLocales
      ] as fakerLocales.Faker) ?? fakerLocales.faker;

    for (let i = 0; i < 10; i++) {
      const state = faker.location.state({
        abbreviated: true,
      });

      let zipcode = faker.location.zipCode();

      try {
        zipcode = faker.location.zipCode({
          state,
        });
      } catch {
        // No locale data for state/zipcode. Ignoring.
      }

      const [firstName, lastName] = [
        fakerLocales.faker.person.firstName(),
        fakerLocales.faker.person.lastName(),
      ];

      const cardholder = await stripe.issuing.cardholders.create(
        {
          billing: {
            address: {
              city: faker.location.city(),
              country: connectedAccount.country ?? 'US',
              line1: faker.location.streetAddress(),
              postal_code: zipcode,
              state,
            },
          },
          individual: {
            first_name: firstName,
            last_name: lastName,
            dob: {
              day: 1,
              month: 11,
              year: 1981,
            },
            card_issuing: {
              user_terms_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: faker.internet.ipv4(),
              },
            },
          },
          // all characters up to 24 max
          name: `${firstName} ${lastName}`.slice(0, 24),
          email: faker.internet.email({
            firstName,
            lastName,
            provider: 'example.com',
          }),
          type: 'individual',
          status: 'active',
        },
        {
          stripeAccount: connectedAccount.id,
        }
      );

      if (seedCards) {
        const card = await stripe.issuing.cards.create(
          {
            cardholder: cardholder.id,
            type: 'virtual',
            currency: connectedAccount.default_currency ?? 'usd',
            status: 'active',
          },
          {
            stripeAccount: connectedAccount.id,
          }
        );

        for (let i = 0; i < 10; i++) {
          if (seedCaptures) {
            const capture =
              await stripe.testHelpers.issuing.transactions.createForceCapture(
                {
                  amount: faker.number.int({
                    min: 5000,
                    max: 50000,
                  }),
                  card: card.id,
                  merchant_data: {
                    name: faker.company.name(),
                  },
                },
                {
                  stripeAccount: connectedAccount.id,
                }
              );

            if (seedRefunds) {
              // 10% chance of refund
              if (faker.number.int({min: 0, max: 10}) === 1) {
                await stripe.testHelpers.issuing.transactions.refund(
                  capture.id,
                  {
                    stripeAccount: connectedAccount.id,
                  }
                );
              }
            }
          }
        }
      }
    }

    return new Response('Issuing data seeded successfully', {status: 200});
  } catch (error: any) {
    console.error(
      'An error occurred when calling the Stripe API to create an account session',
      error
    );
    return new Response(error.message, {status: 500});
  }
}
