import type { Stripe } from 'stripe';
import { Card } from '../common/Card';
import { useTranslation } from 'react-i18next';
import { useDemoConfig } from '@/context/DemoConfigContext';
import type { CurrencyCode } from '@/constants/currencyCodes';
import { useRouter } from 'next/navigation';
import { CurrencyPill } from './CurrencyPill';
import { useQuery } from '@tanstack/react-query';
import { getFinancialAddresses as getFinancialAddressesAction } from '@/app/api/financial-addresses/getFinancialAddresses';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

type FinancialAccountCardProps = {
  financialAccount: Stripe.V2.MoneyManagement.FinancialAccount;
};

export const FinancialAccountCard = ({
  financialAccount,
}: FinancialAccountCardProps) => {
  const { t } = useTranslation();

  const { language, stripeSecretKey } = useDemoConfig();

  const router = useRouter();

  const { account } = useDemoMerchant();

  const { data: financialAddresses, isPending: isFinancialAddressesLoading } = useQuery({
    queryKey: ['financial-addresses', financialAccount.id],
    queryFn: () => getFinancialAddressesAction({
      financialAccountId: financialAccount.id,
      stripeSecretKey,
      accountId: account!.id,
    }),
    enabled: !!account,
  });

  const financialAddress = financialAddresses?.[0];

  let last4 = '';

  switch (financialAddress?.credentials?.type) {
    case 'gb_bank_account':
      last4 = financialAddress?.credentials?.gb_bank_account?.last4 ?? '';
      break;
    case 'us_bank_account':
      last4 = financialAddress?.credentials?.us_bank_account?.last4 ?? '';
      break;
  }

  return (
    <Card
      onClick={() => {
        router.push(
          `/${language}/dashboard/expenses/financial-accounts/${financialAccount.id}`,
        );
      }}
      className='min-h-36 border-brand-primary hover:cursor-pointer hover:bg-gray-50'
      role='button'
    >
      <div className='col-span-9 h-full flex flex-col justify-between'>
        <div>
          <p className='font-semibold'>{financialAccount.display_name}</p>
          {last4 && (
            <p className='text-sm text-gray-500'>
              {t('dashboard.expenses.financial-account-card.ending-in', {
                last4,
              })}
            </p>
          )}
        </div>
        <div>
          <p>
            <span className='font-semibold text-sm'>
              {t('dashboard.expenses.available-balances')}
            </span>
          </p>
          <div className='mt-1 flex flex-wrap gap-y-1 gap-x-2'>
            {Object.entries(financialAccount.balance.available).map(
              ([currency, amount]) => (
                <CurrencyPill
                  key={currency}
                  currency={amount.currency as CurrencyCode}
                  amount={amount.value ?? 0}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
