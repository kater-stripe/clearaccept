import {CheckoutProvider} from '@/app/contexts/CheckoutContext';
import {Elements} from '@stripe/react-stripe-js';
import {useCallback, useEffect, useMemo, useState} from 'react';
import CheckoutForm from './elements/CheckoutForm';
import OrderSummary from './elements/OrderSummary';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {
  loadStripe,
  StripeAddressElementChangeEvent,
  StripeElementLocale,
} from '@stripe/stripe-js';
import appearance from '../config/Appearance';
import {useSession} from 'next-auth/react';
import fetchClient from '@/app/utils/fetchClient';

interface Options {
  mode: 'payment' | undefined;
  amount: number;
  currency: string;
  appearance: any;
  locale: StripeElementLocale | undefined;
}

export default function ElementsCheckoutContent() {
  const [message, setMessage] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const {settings} = useConfigContext();
  const {data: session} = useSession();

  const stripePromise = useMemo(() => {
    if (!settings?.stripePublishableKey) {
      return null;
    }

    return loadStripe(settings.stripePublishableKey, {
      stripeAccount: session?.user.stripeAccount.id,
    });
  }, [settings?.stripePublishableKey]);

  const options = useMemo<Options>(() => {
    return {
      mode: 'payment',
      amount: subtotal + tax,
      currency: settings?.currency || 'usd',
      appearance,
      locale: (settings?.language as StripeElementLocale) || undefined,
    };
  }, [settings?.currency, appearance, settings?.language, subtotal, tax]);

  useEffect(() => {
    const calculateTax = async () => {
      try {
        const {data} = await fetchClient.post('/api/tax', {
          subtotal,
        });
        setTax(data.tax);
      } catch (err) {
        console.log('Tax calculation error', err);
        setTax(0);
      }
    };

    calculateTax();
  }, [subtotal]);

  const handleOrderConfirm = useCallback(
    async (stripe: any, elements: any) => {
      if (!stripe || !elements) {
        return;
      }

      setIsProcessing(true);

      try {
        const {data} = await fetchClient.post('/api/payment-intent', {
          total: subtotal + tax,
        });

        const {clientSecret} = data;
        if (!clientSecret) {
          throw new Error('Failed to create PaymentIntent');
        }

        const {error: submitError} = await elements.submit();
        if (submitError) {
          setMessage(submitError.message);
          setIsProcessing(false);
          return;
        }

        const {error} = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/${settings?.language}/payments`,
          },
        });

        if (error) {
          setMessage(error.message);
        }
      } catch (err) {
        setMessage('An unexpected error occurred.');
      } finally {
        setIsProcessing(false);
      }
    },
    [subtotal, tax]
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutProvider>
        <div className="grid gap-x-12 md:grid-cols-12 xl:gap-x-16">
          {/* Left - Checkout Form */}
          <div className="col-span-6 lg:col-span-7">
            {message && (
              <div className="mb-4 text-center text-red-500">{message}</div>
            )}
            <CheckoutForm />
          </div>

          {/* Right - Order Summary */}
          <div className="relative col-span-6 mt-10 md:mt-0 lg:col-span-5">
            <OrderSummary
              onOrderConfirm={handleOrderConfirm}
              isProcessing={isProcessing}
              subtotal={subtotal}
              tax={tax}
              setSubtotal={setSubtotal}
            />
          </div>
        </div>
      </CheckoutProvider>
    </Elements>
  );
}
