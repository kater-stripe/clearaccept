import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';
import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {withFallbackHeaders} from '@/app/utils/stripe/withFallbackHeaders';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const stripe = initializeStripe(request.headers);
    const {isEmbedded} = await request.json();
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

    // Create a Checkout Session
    const serverSession = await getServerSession(authOptions);
    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price_data: {
              currency: demoConfig.currency,
              unit_amount: 4000,
              product_data: {
                name: 'Group Session',
              },
            },
            quantity: 1,
            adjustable_quantity: {
              enabled: true,
              maximum: 10,
              minimum: 1,
            },
          },
        ],
        mode: 'payment',
        ...(isEmbedded
          ? {
              ui_mode: 'embedded',
              return_url: `${request.headers.get('origin')}/${demoConfig.language}/payments?session_id={CHECKOUT_SESSION_ID}`,
            }
          : {
              success_url: `${request.headers.get('origin')}/${demoConfig.language}/payments?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${request.headers.get('origin')}/${demoConfig.language}/classes`,
            }),
      },
      {
        stripeAccount: serverSession?.user.stripeAccount.id,
      }
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      ...(isEmbedded ? {clientSecret: session.client_secret} : {}),
    });
  } catch (error) {
    console.error('Error in creating checkout session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {error: 'Stripe API error occurred'},
        {status: 400}
      );
    }

    return NextResponse.json(
      {error: 'An internal server error occurred'},
      {status: 500}
    );
  }
}
