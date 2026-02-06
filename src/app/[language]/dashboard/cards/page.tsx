'use client';

import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { ConnectIssuingCardsList } from '@stripe/react-connect-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getBalances as getBalancesAction } from '@/app/api/balances/getBalances';
import { IssuingBalance } from '@/components/issuing/IssuingBalance';
import { fetchEphemeralKey as fetchEphemeralKeyAction } from '@/app/api/issuing/fetchEphemeralKey';

const CardsPage = () => {
  const { stripeSecretKey } = useDemoConfig();
  const { account, isCapabilityActive } = useDemoMerchant();
  const { t } = useTranslation();

  const { data: balances, isPending: isBalancesLoading } = useQuery({
    queryKey: ['balances', account?.id, stripeSecretKey],
    queryFn: () =>
      getBalancesAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: isCapabilityActive('commercial.stripe.charge_card'),
  });

  const { mutateAsync: fetchEphemeralKey } = useMutation({
    mutationFn: fetchEphemeralKeyAction,
  });

  return (
    <div>
      <Card className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold'>
          {t('dashboard.expenses.issuing-balances')}
        </h2>
        {isBalancesLoading && <Skeleton className='h-20 w-full' />}
        {balances?.issuing?.available.map((balance) => (
          <IssuingBalance key={balance.currency} balance={balance} />
        ))}
      </Card>
      <Card className='mt-4'>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.expenses.issuing-cards')}
        </h2>
        <div id='connect-issuing-cards-list'>
          <ConnectIssuingCardsList
            showSpendControls={true}
            fetchEphemeralKey={async ({ issuingCard, nonce }) => {
              const ephemeralKey = await fetchEphemeralKey({
                issuingCard,
                nonce,
                accountId: account!.id,
                stripeSecretKey,
              });

              return ephemeralKey;
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default CardsPage;

