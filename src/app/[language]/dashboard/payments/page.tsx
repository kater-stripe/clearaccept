'use client';

import { Card } from '@/components/common/Card';
import { ConnectPayments } from '@stripe/react-connect-js';
import { useTranslation } from 'react-i18next';

const PaymentsPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Card accent='#77B32A'>
        <div id='connect-payments'>
          <ConnectPayments />
        </div>
      </Card>
    </div>
  );
};

export default PaymentsPage;
