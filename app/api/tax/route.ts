import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {withFallbackHeaders} from '@/app/utils/stripe/withFallbackHeaders';
import {authOptions} from '@/lib/auth';
import {getServerSession} from 'next-auth';
import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const stripe = initializeStripe(request.headers);
    const {subtotal} = await request.json();

    if (!subtotal) {
      return NextResponse.json({error: 'Subtotal is required'}, {status: 400});
    }

    const demoConfig = withFallbackHeaders(request.headers);

    if (!demoConfig.stripeSecretKey) {
      return NextResponse.json(
        {error: 'Stripe Secret Key is not available'},
        {status: 400}
      );
    }

    if (!demoConfig.currency) {
      return NextResponse.json(
        {error: 'Currency is not specified'},
        {status: 400}
      );
    }

    // Calculate tax
    const session = await getServerSession(authOptions);
    const account = await stripe.accounts.retrieve(
      session?.user.stripeAccount.id!
    );
    const calculation = await stripe.tax.calculations.create(
      {
        currency: demoConfig.currency,
        line_items: [
          {
            amount: subtotal,
            reference: 'in_person_transaction',
            tax_behavior: 'exclusive',
            tax_code: 'txcd_99999999',
          },
        ],
        customer_details: {
          address: {
            country: account.company?.address?.country || 'us',
            state: account.company?.address?.state,
            city: account.company?.address?.city,
            postal_code: account.company?.address?.postal_code,
          },
        },
      },
      {
        stripeAccount: session?.user.stripeAccount.id!,
      }
    );

    return NextResponse.json({
      tax: calculation.amount_total,
    });
  } catch (error) {
    console.error('Error in tax calculation:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        tax: 0,
      });
    }

    return NextResponse.json(
      {error: 'An internal server error occurred'},
      {status: 500}
    );
  }
}
