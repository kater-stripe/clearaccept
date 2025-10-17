'use client';

import { getLatestFinancingOffer as getLatestFinancingOfferAction } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import {
  ConnectCapitalFinancing,
  ConnectCapitalFinancingApplication,
  ConnectCapitalFinancingPromotion,
} from '@stripe/react-connect-js';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CapitalAndFundingPage = () => {
  const { t } = useTranslation();
  const { capitalFinancingPromotionLayout, stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();

  const [
    waitingForFinancingOfferToUpdate,
    setWaitingForFinancingOfferToUpdate,
  ] = useState(false);

  const { data: latestFinancingOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () => {
      const result = await getLatestFinancingOfferAction({
        accountId: account!.id,
        stripeSecretKey,
      });

      if (result.status === 'accepted' && waitingForFinancingOfferToUpdate) {
        window.location.reload();

        // We wait for the page to reload. This is a bit of a hack to ensure we don't update the state before the page has reloaded.
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return result;
    },
    refetchInterval: waitingForFinancingOfferToUpdate ? 1000 : false,
  });

  const shouldShowPromotion =
    latestFinancingOffer?.status !== 'paid_out' &&
    latestFinancingOffer?.status !== 'completed' &&
    latestFinancingOffer?.status !== 'accepted' &&
    latestFinancingOffer?.status !== 'rejected';

  const shouldShowApplication =
    latestFinancingOffer?.status === 'delivered' ||
    latestFinancingOffer?.status === 'completed';

  if (waitingForFinancingOfferToUpdate) {
    return <LoadingSpinner className='size-8 text-brand-primary' />;
  }

  return (
    <div>
      {capitalFinancingPromotionLayout === 'full' && shouldShowPromotion && (
        <Card>
          <h2 className='text-lg font-semibold mb-4'>
            {t('dashboard.capital.promotions')}
          </h2>
          <div id='connect-capital-financing-promotion'>
            <ConnectCapitalFinancingPromotion layout='full' />
          </div>
        </Card>
      )}
      <div
        className={`grid gap-4 ${capitalFinancingPromotionLayout === 'banner' ? 'grid-cols-12' : 'mt-4 grid-cols-8'}`}
      >
        <Card
          className={`col-span-12 xl:col-span-8 order-2 xl:order-1 ${shouldShowPromotion ? 'xl:col-span-8' : 'xl:col-span-12'}`}
        >
          <h2 className='text-lg font-semibold mb-4'>
            {t('dashboard.capital.financings')}
          </h2>
          <div id='connect-capital-financing'>
            <ConnectCapitalFinancing />
          </div>
        </Card>
        {capitalFinancingPromotionLayout === 'banner' &&
          shouldShowPromotion && (
            <Card className='col-span-12 xl:col-span-4 order-1 xl:order-2'>
              <h2 className='text-lg font-semibold mb-4'>
                {t('dashboard.capital.promotions')}
              </h2>
              <div id='connect-capital-financing-promotion'>
                <ConnectCapitalFinancingPromotion
                  layout='banner'
                  onApplicationSubmitted={() => {
                    setWaitingForFinancingOfferToUpdate(true);
                  }}
                />
              </div>
            </Card>
          )}
      </div>
      {latestFinancingOffer && shouldShowApplication && (
        <Card className='mt-4'>
          <h2 className='text-lg font-semibold mb-4'>
            {t('dashboard.capital.financing-application')}
          </h2>
          <div id='connect-capital-financing-application'>
            <ConnectCapitalFinancingApplication
              onApplicationSubmitted={() => {
                setWaitingForFinancingOfferToUpdate(true);
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default CapitalAndFundingPage;
