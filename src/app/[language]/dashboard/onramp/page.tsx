'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';
import type { OnrampSessionResponse, ServerErrorPayload } from '@/types/onramp';
import { createOnrampSession } from '@/app/api/onramp-session/createOnrampSession';
import { useTranslation } from 'react-i18next';

export default function OnrampPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { stripePublishableKey, language, configure } = useDemoConfig();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onrampReady, setOnrampReady] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const isLoading = !error && (!clientSecret || !onrampReady || !stripeReady);
  const { t } = useTranslation();

  const mountOnramp = useCallback((): void => {
    if (!clientSecret) return;
    if (!stripePublishableKey) {
      setError(t('onramp.errors.missing_pk'));
      return;
    }
    if (!containerRef.current) return;
    const factory = window.StripeOnramp;
    if (!factory) return;
    containerRef.current.innerHTML = '';
    try {
      const onramp = factory(stripePublishableKey);
      const session = onramp.createSession({ clientSecret });
      session.addEventListener(
        'onramp_session_updated',
        (evt: OnrampSessionUpdatedEvent) => {
          const s = evt?.payload?.session;
          if (!s) return;
          if (s.status === 'fulfillment_complete') {
            // Mark user eligible for one-time 20% discount and hide promo banner (without disabling crypto)
            configure('onrampDiscountEligible', true);
            configure('onrampBannerVisible', false);
            router.push(`/${language}/dashboard`);
          }
        },
      );
      session.mount(containerRef.current);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : t('onramp.errors.mount_failed');
      setError(message);
    }
  }, [clientSecret, stripePublishableKey, language, router]);

  useEffect(() => {
    const mint = async () => {
      try {
        const session = (await createOnrampSession({ body: {} })) as OnrampSessionResponse;
        setClientSecret(session.client_secret);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : t('onramp.errors.create_failed');
        setError(message);
      }
    };
    mint();
  }, []);

  useEffect(() => {
    if (clientSecret && onrampReady && stripeReady) {
      mountOnramp();
    }
  }, [clientSecret, onrampReady, stripeReady, mountOnramp]);

  return (
    <div className='max-w-xl mx-auto py-8'>
      <Script
        src='https://js.stripe.com/clover/stripe.js'
        strategy='afterInteractive'
        onLoad={() => setStripeReady(true)}
      />
      <Script
        src='https://crypto-js.stripe.com/crypto-onramp-outer.js'
        strategy='afterInteractive'
        onLoad={() => setOnrampReady(true)}
      />
      <h1 className='text-xl text-black font-bold mb-4'>
        {t('onramp.page.title')}
      </h1>
      {error && <p className='text-red-600 mb-4'>{error}</p>}
      {isLoading ? (
        <div className='flex items-center justify-center h-64'>
          <LoadingSpinner className='text-black' />
        </div>
      ) : (
        <div id='onramp-element' ref={containerRef} />
      )}
    </div>
  );
}


