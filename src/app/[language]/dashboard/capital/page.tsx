'use client';

import { createCapitalOffer as createCapitalOfferAction } from '@/app/api/financing-offers/createCapitalOffer';
import { getLatestFinancingOffer as getLatestFinancingOfferAction } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import {
  ConnectCapitalFinancing,
  ConnectCapitalFinancingApplication,
} from '@stripe/react-connect-js';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ACTIVE_FINANCING_STATUSES = ['accepted', 'paid_out'];
const SEED_BLOCKED_STATUSES = ['delivered', 'accepted', 'paid_out', 'paid_off', 'completed'];

const getOfferStatus = (offer: { status?: string; state?: string } | null | undefined) =>
  offer?.status ?? offer?.state;

const CapitalAndFundingPage = () => {
  const { t } = useTranslation();
  const { stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();

  const [waitingForFinancingOfferToUpdate, setWaitingForFinancingOfferToUpdate] = useState(false);

  const { data: latestFinancingOffer, refetch: refetchOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () => {
      return getLatestFinancingOfferAction({ accountId: account!.id, stripeSecretKey });
    },
    refetchInterval: waitingForFinancingOfferToUpdate ? 1000 : false,
    enabled: !!account,
  });

  const offerStatus = getOfferStatus(latestFinancingOffer);

  useEffect(() => {
    if (
      waitingForFinancingOfferToUpdate &&
      offerStatus &&
      ACTIVE_FINANCING_STATUSES.includes(offerStatus)
    ) {
      setWaitingForFinancingOfferToUpdate(false);
    }
  }, [waitingForFinancingOfferToUpdate, offerStatus]);

  // Auto-seed a test offer when the account has no active offer.
  // Silently ignored if the platform doesn't have Capital enabled.
  useEffect(() => {
    if (!account || latestFinancingOffer === undefined) return;
    const hasActiveOffer =
      latestFinancingOffer &&
      offerStatus &&
      SEED_BLOCKED_STATUSES.includes(offerStatus);
    if (!hasActiveOffer) {
      const country = (account.identity?.country?.toUpperCase() === 'GB' ? 'GB' : 'US') as 'GB' | 'US';
      createCapitalOfferAction({ accountId: account.id, country, stripeSecretKey })
        .then(() => refetchOffer())
        .catch(() => {/* Capital not enabled on this platform */});
    }
  }, [account?.id, latestFinancingOffer, offerStatus]);

  const offerIsDelivered = offerStatus === 'delivered';
  const offerIsActive =
    !!offerStatus && ACTIVE_FINANCING_STATUSES.includes(offerStatus);

  if (waitingForFinancingOfferToUpdate) {
    return <LoadingSpinner className='size-8 text-brand-primary' />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Show active financing (post-acceptance) */}
      {offerIsActive && (
        <div style={{ background: '#fff', borderLeft: '4px solid #77B32A', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '24px 28px' }}>
          <div style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            {t('dashboard.capital.financings')}
          </div>
          <ConnectCapitalFinancing />
        </div>
      )}

      {/* Show application (pre-acceptance, status=delivered) */}
      {offerIsDelivered && (
        <div style={{ background: '#fff', borderLeft: '4px solid #77B32A', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '24px 28px' }}>
          <div style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            {t('dashboard.capital.financing-application')}
          </div>
          <ConnectCapitalFinancingApplication
            onApplicationSubmitted={() => setWaitingForFinancingOfferToUpdate(true)}
          />
        </div>
      )}
    </div>
  );
};

export default CapitalAndFundingPage;
