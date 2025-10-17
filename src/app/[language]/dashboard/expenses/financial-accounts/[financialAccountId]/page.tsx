'use client';

import { Card } from '@/components/common/Card';
import {
  ConnectFinancialAccount,
  ConnectFinancialAccountTransactions,
} from '@stripe/react-connect-js';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const FinancialAccountPage = () => {
  const { financialAccountId } = useParams<{ financialAccountId: string }>();

  const { t } = useTranslation();

  return (
    <div>
      <Card>
        <div id='connect-financial-account'>
          <ConnectFinancialAccount financialAccount={financialAccountId} />
        </div>
      </Card>
      <Card className='mt-4'>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.expenses.financial-account.transactions')}
        </h2>
        <div id='connect-financial-account-transactions'>
          <ConnectFinancialAccountTransactions
            financialAccount={financialAccountId}
          />
        </div>
      </Card>
    </div>
  );
};

export default FinancialAccountPage;
