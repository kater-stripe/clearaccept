'use client';

import { Card } from '@/components/common/Card';
import { ConnectPaymentMethodSettings } from '@stripe/react-connect-js';
import { useTranslation } from 'react-i18next';

const PaymentSettingsPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Card>
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

export default PaymentSettingsPage;
