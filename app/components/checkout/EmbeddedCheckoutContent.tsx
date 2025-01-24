import {useConfigContext} from '@/app/contexts/ConfigContext';
import fetchClient from '@/app/utils/fetchClient';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import {useSession} from 'next-auth/react';
import appearance from '../config/Appearance';
import {useEffect, useMemo, useState} from 'react';
import {Spinner} from '../ui';
import {useTranslation} from 'react-i18next';

interface Options {
  clientSecret: string | null;
}

export function EmbeddedCheckoutContent() {
  const {t} = useTranslation();
  const {settings} = useConfigContext();
  const {data: session} = useSession();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!settings?.stripePublishableKey) {
      return null;
    }

    return loadStripe(settings.stripePublishableKey, {
      stripeAccount: session?.user.stripeAccount.id,
    });
  }, [settings?.stripePublishableKey]);

  useEffect(() => {
    fetchClient
      .post<null, {data: {clientSecret: string}}>('/api/checkout-session', {
        isEmbedded: true,
      })
      .then(({data: {clientSecret}}) => {
        setClientSecret(clientSecret);
      })
      .catch((error) => {
        console.error('Error fetching client secret:', error);
      });
  }, [fetchClient]);

  const options = useMemo<Options>(() => {
    return {
      clientSecret,
    };
  }, [appearance, settings?.language, clientSecret]);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        {clientSecret && <EmbeddedCheckout />}
        {!clientSecret && (
          <div className="flex flex-col items-center py-8">
            <Spinner />
            <p className="text-text-color mt-4 text-lg font-semibold">
              {t('loading')}
            </p>
          </div>
        )}
      </EmbeddedCheckoutProvider>
    </div>
  );
}
