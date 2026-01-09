'use client';

import { Card } from '@/components/common/Card';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ConnectBalances,
  ConnectCapitalFinancingPromotion,
  ConnectInstantPayoutsPromotion,
  ConnectRecipients,
} from '@stripe/react-connect-js';
import { getLatestFinancingOffer as getLatestFinancingOfferAction } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { Schedule } from '@/components/dashboard/Schedule';
import { useState } from 'react';

const DashboardPage = () => {
  const { t } = useTranslation();

  const { stripeSecretKey, capitalFinancingPromotionLayout } = useDemoConfig();
  const { account, isCapitalEligible } = useDemoMerchant();

  const { data: latestFinancingOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () =>
      getLatestFinancingOfferAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: isCapitalEligible,
  });

  const shouldShowPromotion =
    latestFinancingOffer?.status !== 'paid_out' &&
    latestFinancingOffer?.status !== 'completed' &&
    latestFinancingOffer?.status !== 'accepted' &&
    latestFinancingOffer?.status !== 'rejected';

  const [isInstantPayoutsPromotionShown, setIsInstantPayoutsPromotionShown] =
    useState(false);

  return (
    <div className='grid grid-cols-12 gap-4'>
      <div className='col-span-12 lg:col-span-8'>
        <Card>
          <h2 className='text-lg font-semibold mb-4'>
            {t('dashboard.home.balances')}
          </h2>
          <ConnectBalances />
        </Card>
      </div>
      <div className='col-span-12 lg:col-span-4 flex flex-col gap-4'>
        <Card
          className={`${isInstantPayoutsPromotionShown ? 'visible' : 'hidden'}`}
        >
          <div id='connect-instant-payouts-promotion'>
            <ConnectInstantPayoutsPromotion
              onInstantPayoutsPromotionLoaded={({ promotionShown }) =>
                setIsInstantPayoutsPromotionShown(promotionShown)
              }
            />
          </div>
          <ConnectRecipients dataSource='customers' />
        </Card>
        {isCapitalEligible && shouldShowPromotion && (
          <Card>
            <h2 className='text-lg font-semibold mb-4'>
              {t('dashboard.home.capital')}
            </h2>
            <div id='connect-capital-financing-promotion'>
              <ConnectCapitalFinancingPromotion
                layout={capitalFinancingPromotionLayout}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
