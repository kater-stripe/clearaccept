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
      // Ensure the user exists on Stripe
      console.log('Signing in user', user);

      return true;
    },

    async session({session}) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let stripeAccount;
      const balance = {available: 0, pending: 0};
      let charges = [];
      let mtdEarnings = 0;

      try {
        const stripe = initializeStripe(
          new Headers(
            session.user.name ? {'demo-stripesecretkey': session.user.name} : {}
          )
        );
        const accountList = await stripe.accounts.list();
        stripeAccount = accountList.data.find(
          (account) => account.email === session.user?.email
        );

        // Balance
        const accountBalance = await stripe.balance.retrieve({
          stripeAccount: stripeAccount?.id,
        });
        balance.available = accountBalance.available.reduce(
          (accum, curr) => accum + curr.amount,
          0
        );
        balance.pending = accountBalance.pending.reduce(
          (accum, curr) => accum + curr.amount,
          0
        );

        // Charge list
        const accountCharges = await stripe.charges.list(
          {limit: 100, expand: ['data.balance_transaction']},
          {
            stripeAccount: stripeAccount?.id,
          }
        );
        charges = accountCharges.data
          .filter((charge) => charge.status === 'succeeded')
          .slice(0, 3);
        mtdEarnings = accountCharges.data
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
      } catch (err) {
        console.error('Could not retrieve stripe account for user', err);
        throw err;
      }

      if (!stripeAccount) {
        throw 'Could not retrieve Stripe account for user';
      }

      session.user.stripeAccount = stripeAccount;
      session.user.pendingBalance = balance.pending;
      session.user.availableBalance = balance.available;
      session.user.name = stripeAccount?.business_profile?.name || 'Instructor';
      session.user.charges = charges;
      session.user.mtdEarnings = mtdEarnings;

      console.log(
        `Got session for user ${session.user?.email} and stripe account ${stripeAccount.id}`
      );

      return session;
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
          const accountList = await stripe.accounts.list();
          const account = accountList.data.find(
            (account) => account.email === email
          );
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

          // See if they exist on the platform
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
          // Register the Stripe account
          const stripe = initializeStripe(
            new Headers({'demo-stripesecretkey': credentials.stripe_sk})
          );
          const platformAccount = await stripe.accounts.retrieve();

          const controller = {
            losses: {payments: 'application'},
            fees: {payer: 'application'},
            requirement_collection: 'application',
            stripe_dashboard: {
              type: 'none' as const, // The connected account will not have access to dashboard
            },
          };

          console.log('Creating stripe account for the email', email);

          const capabilities: any = {
            card_payments: {
              requested: true,
            },
            transfers: {
              requested: true,
            },
          };

          switch (country) {
            case 'AT':
            case 'BE':
            case 'HR':
            case 'CY':
            case 'EE':
            case 'FI':
            case 'FR':
            case 'DE':
            case 'GR':
            case 'IE':
            case 'IT':
            case 'LV':
            case 'LT':
            case 'LU':
            case 'MT':
            case 'NL':
            case 'PT':
            case 'SK':
            case 'SI':
            case 'ES':
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
                ].includes(platformAccount.country || '')
              ) {
                capabilities['card_issuing'] = {requested: true};
              }
              break;
            case 'GB':
              if (platformAccount.country == 'GB') {
                capabilities['card_issuing'] = {requested: true};
              }
              break;
            case 'US':
              if (platformAccount.country === 'US') {
                capabilities['treasury'] = {requested: true};
                capabilities['card_issuing'] = {requested: true};
              }
              break;
            default:
              break;
          }

          const account = await stripe.accounts.create({
            // @ts-ignore
            controller,
            capabilities,
            country,
            email,
          });

          if (country == 'US' && platformAccount.country === 'US') {
            await stripe.treasury.financialAccounts.create(
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
            name: credentials.stripe_sk, // actually the stripe sk
          };
        } catch (error: any) {
          console.log(
            'Got an error authorizing and creating a user during signup',
            error
          );
          return null;
        }
      },
    }),
  ],
};
