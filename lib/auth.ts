import type {AuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {countryToCurrency} from '@/lib/currency';
import Stripe from 'stripe';
import initializeStripe from '@/app/utils/stripe/initializeStripe';

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({user}) {
      console.log('Signing in user', user);
      return true;
    },

    async session({session, token}) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      try {
        const stripe = initializeStripe(
          new Headers(
            session.user.name ? {'demo-stripesecretkey': session.user.name} : {}
          )
        );

        const [stripeAccount, accountBalance, accountCharges] =
          await Promise.all([
            stripe.accounts.retrieve({
              stripeAccount: token.sub,
            }),
            stripe.balance.retrieve({
              stripeAccount: token.sub,
            }),
            stripe.charges.list(
              {limit: 50, expand: ['data.balance_transaction']},
              {
                stripeAccount: token.sub,
              }
            ),
          ]);

        if (!stripeAccount) {
          throw 'Could not retrieve Stripe account for user';
        }

        const balance = {
          available: accountBalance.available.reduce(
            (accum, curr) => accum + curr.amount,
            0
          ),
          pending: accountBalance.pending.reduce(
            (accum, curr) => accum + curr.amount,
            0
          ),
        };

        const charges = accountCharges.data
          .filter((charge) => charge.status === 'succeeded')
          .slice(0, 3);

        const mtdEarnings = accountCharges.data
          .filter(
            (charge) =>
              charge.status === 'succeeded' &&
              charge.created >= Math.floor(startOfMonth.getTime() / 1000)
          )
          .reduce(
            (acc, charge) =>
              (charge.balance_transaction as Stripe.BalanceTransaction).net +
              acc,
            0
          );

        session.user.stripeAccount = stripeAccount;
        session.user.pendingBalance = balance.pending;
        session.user.availableBalance = balance.available;
        session.user.name =
          stripeAccount?.business_profile?.name || 'Instructor';
        session.user.charges = charges;
        session.user.mtdEarnings = mtdEarnings;

        console.log(
          `Got session for user ${session.user?.email} and stripe account ${stripeAccount.id}`
        );

        return session;
      } catch (err) {
        console.error('Could not retrieve stripe account for user', err);
        throw err;
      }
    },
  },
  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'Email & Password',
      credentials: {
        email: {},
        password: {},
        stripe_sk: {},
      },
      async authorize(credentials, req) {
        try {
          const email = credentials?.email;

          if (!email) {
            console.log('Could not find an email for provider');
            return null;
          }

          const headers = new Headers({
            'demo-stripesecretkey': credentials?.stripe_sk,
          });
          const stripe = initializeStripe(headers);

          // Accounts are not queryable. Workaround: user customer metadata as a mapping to accounts until v2 is available
          const customerMapping = await stripe.customers.list({
            limit: 1,
            email,
          });
          if (!customerMapping.data.length) {
            return null;
          }

          const account = await stripe.accounts.retrieve({
            stripeAccount:
              customerMapping.data[0]?.metadata?.connectedAccountId,
          });
          if (!account) {
            return null;
          }

          return {
            id: account.id,
            email: account.email,
            name: credentials?.stripe_sk, // actually the sk
          };
        } catch (err) {
          console.warn('Got an error authorizing a user during login', err);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'loginas',
      name: 'Account ID',
      credentials: {
        accountId: {},
        stripe_sk: {},
      },
      async authorize(credentials, req) {
        try {
          const stripeAccountId = credentials?.accountId;

          if (!stripeAccountId) {
            console.log('Could not find an account id for provider');
            return null;
          }

          const stripe = initializeStripe(
            new Headers({'demo-stripesecretkey': credentials.stripe_sk})
          );
          const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);

          return {
            id: stripeAccount.id,
            email: stripeAccount.email,
            name: credentials.stripe_sk,
          };
        } catch (err) {
          console.warn('Got an error authorizing a user during login', err);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'signup',
      name: 'Email & Password',
      credentials: {
        email: {},
        password: {},
        stripe_sk: {},
      },
      async authorize(credentials, req) {
        console.log('Signing up');

        const email = credentials?.email;
        const country = req.body?.country;

        if (!email || !country) {
          console.log('Could not find an email for authorization');
          return null;
        }

        try {
          const stripe = initializeStripe(
            new Headers({'demo-stripesecretkey': credentials.stripe_sk})
          );
          const platformAccount = await stripe.accounts.retrieve();

          const controller = {
            losses: {payments: 'application'},
            fees: {payer: 'application'},
            requirement_collection: 'application',
            stripe_dashboard: {
              type: 'none' as const,
            },
          };

          console.log('Creating stripe account for the email', email);

          const capabilities: any = {
            card_payments: {requested: true},
            transfers: {requested: true},
          };

          if (
            [
              'AT',
              'BE',
              'HR',
              'CY',
              'EE',
              'FI',
              'FR',
              'DE',
              'GR',
              'IE',
              'IT',
              'LV',
              'LT',
              'LU',
              'MT',
              'NL',
              'PT',
              'SK',
              'SI',
              'ES',
            ].includes(country) &&
            [
              'AT',
              'BE',
              'HR',
              'CY',
              'EE',
              'FI',
              'FR',
              'DE',
              'GR',
              'IE',
              'IT',
              'LV',
              'LT',
              'LU',
              'MT',
              'NL',
              'PT',
              'SK',
              'SI',
              'ES',
            ].includes(platformAccount.country || '')
          ) {
            capabilities['card_issuing'] = {requested: true};
          } else if (country === 'GB' && platformAccount.country === 'GB') {
            capabilities['card_issuing'] = {requested: true};
          } else if (country === 'US' && platformAccount.country === 'US') {
            capabilities['treasury'] = {requested: true};
            capabilities['card_issuing'] = {requested: true};
          }

          const account = await stripe.accounts.create({
            // @ts-ignore
            controller,
            capabilities,
            country,
            email,
          });

          // Accounts are not queryable. Workaround: user customer metadata as a mapping to accounts until v2 is available
          await stripe.customers.create({
            email,
            metadata: {
              connectedAccountId: account.id,
            },
          });

          let financialAccount = null;
          if (country === 'US' && platformAccount.country === 'US') {
            financialAccount = await stripe.treasury.financialAccounts.create(
              {
                supported_currencies: ['usd'],
              },
              {stripeAccount: account.id}
            );
          }

          console.log('Account has been created with id', account.id);

          return {
            id: account.id,
            email,
            name: credentials.stripe_sk,
          };
        } catch (error: any) {
          console.log(
            'Got an error authorizing and creating a user during signup',
            error
          );
          throw error;
        }
      },
    }),
  ],
};
