import type { Stripe } from 'stripe';
import { Card } from '../common/Card';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatPrice';
import { useDemoConfig } from '@/context/DemoConfigContext';
import type { CurrencyCode } from '@/constants/currencyCodes';
import { useRouter } from 'next/navigation';
import { CurrencyPill } from './CurrencyPill';

type FinancialAccountCardProps = {
  financialAccount: Stripe.Treasury.FinancialAccount;
};

export const FinancialAccountCard = ({
  financialAccount,
}: FinancialAccountCardProps) => {
  const { t } = useTranslation();

  const { language } = useDemoConfig();

  const router = useRouter();

  const last4 =
    financialAccount.financial_addresses?.[0]?.aba?.account_number_last4;

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
            {Object.entries(financialAccount.balance.cash).map(
              ([currency, amount]) => (
                <CurrencyPill
                  key={currency}
                  currency={currency as CurrencyCode}
                  amount={amount}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
