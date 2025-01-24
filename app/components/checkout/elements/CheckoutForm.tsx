'use client';

import {useState, useEffect} from 'react';
import {useStripe, useElements} from '@stripe/react-stripe-js';
import {useTranslation} from 'react-i18next';
import {useCheckout} from '@/app/contexts/CheckoutContext';
import AddressElementWrapper from './AddressElementWrapper';
import PaymentElementWrapper from './PaymentElementWrapper';

export default function CheckoutForm() {
  const [message, setMessage] = useState<string | null>(null);
  const {setStripe, setElements} = useCheckout();
  const {t} = useTranslation();

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (stripe && elements) {
      setStripe(stripe);
      setElements(elements);
    }
  }, [stripe, elements, setStripe, setElements]);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
        if (!paymentIntent) {
          setMessage(t('checkout.payment_status.error'));
          return;
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            setMessage(t('checkout.payment_status.succeeded'));
            break;
          case 'processing':
            setMessage(t('checkout.payment_status.processing'));
            break;
          case 'requires_payment_method':
            setMessage(t('checkout.payment_status.requires_payment_method'));
            break;
          default:
            setMessage(t('checkout.payment_status.error'));
            break;
        }
      });
    }
  }, [stripe, t]);

  return (
    <div className="col-span-6 lg:col-span-7">
      <PaymentElementWrapper />

      {message && <div id="payment-message">{message}</div>}
    </div>
  );
}
