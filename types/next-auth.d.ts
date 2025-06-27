import NextAuth, {DefaultSession} from 'next-auth';
import Stripe from 'stripe';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's Stripe account. */
      stripeSecretKey: string;
      stripeAccount: Stripe.Account;
      pendingBalance: number;
      availableBalance: number;
      charges: Stripe.Charge[];
      mtdEarnings: number;
      customerCount: number;
      accountType: 'v1' | 'v2';
      customerId: string;
    } & DefaultSession['user'];
  }
}
