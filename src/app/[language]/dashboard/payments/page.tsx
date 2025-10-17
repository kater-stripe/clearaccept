'use client';

import { Card } from '@/components/common/Card';
import {
  ConnectPaymentMethodSettings,
  ConnectPayments,
} from '@stripe/react-connect-js';
import { useTranslation } from 'react-i18next';

const PaymentsAndDisputesPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Card>
        <div id='connect-payments'>
          <ConnectPayments />
        </div>
      </Card>
      <Card className='mt-4'>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.payments.payment-method-settings')}
        </h2>
        <div id='connect-payment-method-settings'>
          <ConnectPaymentMethodSettings />
        </div>
      </Card>
    </div>
  );
};

export default PaymentsAndDisputesPage;
