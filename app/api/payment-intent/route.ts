import {withFallbackHeaders} from '@/app/utils/stripe/withFallbackHeaders';
import {authOptions} from '@/lib/auth';
import {getServerSession} from 'next-auth';
import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const {total} = await request.json();

    if (!total || total < 1) {
      return NextResponse.json({error: 'Invalid amount'}, {status: 400});
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

    const session = await getServerSession(authOptions);
    const stripe = new Stripe(demoConfig.stripeSecretKey);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: total,
        currency: demoConfig.currency,
        automatic_payment_methods: {enabled: true},
        description: 'Group Session',
      },
      {
        stripeAccount: session?.user.stripeAccount.id!,
      }
    );

    return NextResponse.json({clientSecret: paymentIntent.client_secret});
  } catch (error) {
    console.error('Error in payment-intent:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {error: 'Stripe API error occurred or bad API keys provided'},
        {status: 400}
      );
    }

    return NextResponse.json(
      {error: 'An internal server error occurred'},
      {status: 500}
    );
  }
}
