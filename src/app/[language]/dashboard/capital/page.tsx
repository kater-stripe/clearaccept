'use client';

import { getLatestFinancingOffer as getLatestFinancingOfferAction } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import {
  ConnectCapitalFinancing,
  ConnectCapitalFinancingApplication,
} from '@stripe/react-connect-js';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CapitalAndFundingPage = () => {
  const { t } = useTranslation();
  const { stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();

  const [waitingForFinancingOfferToUpdate, setWaitingForFinancingOfferToUpdate] = useState(false);

  const { data: latestFinancingOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () => {
      const result = await getLatestFinancingOfferAction({ accountId: account!.id, stripeSecretKey });
      if (result.status === 'accepted' && waitingForFinancingOfferToUpdate) {
        window.location.reload();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      return result;
    },
    refetchInterval: waitingForFinancingOfferToUpdate ? 1000 : false,
  });

  const shouldShowApplication =
    latestFinancingOffer?.status === 'delivered' ||
    latestFinancingOffer?.status === 'completed';

  if (waitingForFinancingOfferToUpdate) {
    return <LoadingSpinner className='size-8 text-brand-primary' />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderLeft: '4px solid #77B32A', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
          {t('dashboard.capital.financings')}
        </div>
        <ConnectCapitalFinancing />
      </div>

      {latestFinancingOffer && shouldShowApplication && (
        <div style={{ background: '#fff', borderLeft: '4px solid #323E48', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '24px 28px' }}>
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
