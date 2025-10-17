'use client';

import { Card } from '@/components/common/Card';
import {
  ConnectExportTaxTransactions,
  ConnectTaxRegistrations,
  ConnectTaxSettings,
  ConnectTaxThresholdMonitoring,
} from '@stripe/react-connect-js';
import { useTranslation } from 'react-i18next';

const TaxPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Card>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.tax.tax-settings')}
        </h2>
        <div id='connect-tax-settings'>
          <ConnectTaxSettings />
        </div>
      </Card>
      <Card className=' mt-4'>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.tax.tax-registrations')}
        </h2>
        <div id='connect-tax-registrations'>
          <ConnectTaxRegistrations />
        </div>
      </Card>
      <Card className=' mt-4'>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.tax.export-tax-transactions')}
        </h2>
        <div id='connect-export-tax-transactions'>
          <ConnectExportTaxTransactions />
        </div>
      </Card>
      <Card className='mt-4'>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.tax.tax-threshold-monitoring')}
        </h2>
        <div id='connect-tax-threshold-monitoring'>
          <ConnectTaxThresholdMonitoring />
        </div>
      </Card>
    </div>
  );
};

export default TaxPage;
