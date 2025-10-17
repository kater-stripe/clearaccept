'use client';

import { getFinancialAccounts as getFinancialAccountsAction } from '@/app/api/financial-accounts/getFinancialAccounts';
import { Card } from '@/components/common/Card';
import { FinancialAccountCard } from '@/components/financial-account/FinancialAccountCard';
import { CreateFinancialAccountModal } from '@/components/financial-account/CreateFinancialAccountModal';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ConnectIssuingCardsList } from '@stripe/react-connect-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBalances as getBalancesAction } from '@/app/api/balances/getBalances';
import { IssuingBalance } from '@/components/issuing/IssuingBalance';
import { fetchEphemeralKey as fetchEphemeralKeyAction } from '@/app/api/issuing/fetchEphemeralKey';

const FinancialAccountsAndIssuingPage = () => {
  const { stripeSecretKey } = useDemoConfig();
  const { account, isCapabilityActive } = useDemoMerchant();
  const { t } = useTranslation();

  const { data: financialAccounts, isPending: isFinancialAccountsLoading } =
    useQuery({
      queryKey: ['financial-accounts', account?.id, stripeSecretKey],
      queryFn: () =>
        getFinancialAccountsAction({
          accountId: account!.id,
          stripeSecretKey,
        }),
      enabled: !!account,
    });

  const [
    isCreateFinancialAccountModalOpen,
    setIsCreateFinancialAccountModalOpen,
  ] = useState(false);

  const canCreateFinancialAccount =
    !isFinancialAccountsLoading &&
    financialAccounts &&
    financialAccounts.length < 3;

  const { data: balances, isPending: isBalancesLoading } = useQuery({
    queryKey: ['balances', account?.id, stripeSecretKey],
    queryFn: () =>
      getBalancesAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: isCapabilityActive('card_issuing'),
  });

  const { mutateAsync: fetchEphemeralKey } = useMutation({
    mutationFn: fetchEphemeralKeyAction,
  });

  return (
    <>
      <CreateFinancialAccountModal
        open={isCreateFinancialAccountModalOpen}
        onClose={() => setIsCreateFinancialAccountModalOpen(false)}
      />
      <div>
        {isCapabilityActive('treasury') && (
          <Card>
            <h2 className='text-lg font-semibold mb-4'>
              {t('dashboard.expenses.financial-accounts')}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {isFinancialAccountsLoading && (
                <>
                  <div className='min-h-36 bg-gray-100 animate animate-pulse' />
                  <div className='min-h-36 bg-gray-100 animate animate-pulse' />
                  <div className='min-h-36 bg-gray-100 animate animate-pulse' />
                </>
              )}
              {financialAccounts?.map((financialAccount) => (
                <FinancialAccountCard
                  key={financialAccount.id}
                  financialAccount={financialAccount}
                />
              ))}
              <button
                onClick={() => setIsCreateFinancialAccountModalOpen(true)}
                disabled={!canCreateFinancialAccount}
                className={`min-h-36 border border-gray-500 text-gray-500 rounded-md border-dashed flex flex-col gap-y-2 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 hover:text-brand-primary hover:border-brand-primary`}
              >
                <PlusIcon className='size-4' strokeWidth={2.5} />
                <span>{t('dashboard.expenses.create-financial-account')}</span>
              </button>
            </div>
          </Card>
        )}
        {isCapabilityActive('card_issuing') && (
          <>
            <Card className='mt-4 flex flex-col gap-4'>
              <h2 className='text-lg font-semibold'>
                {t('dashboard.expenses.issuing-balances')}
              </h2>
              {isBalancesLoading && (
                <div className='h-20 w-full bg-gray-100 animate animate-pulse' />
              )}
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
          </>
        )}
      </div>
    </>
  );
};

export default FinancialAccountsAndIssuingPage;
