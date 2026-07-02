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
      <Card accent='#77B32A'>
        <h2 style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          {t('dashboard.tax.tax-settings')}
        </h2>
        <div id='connect-tax-settings'>
          <ConnectTaxSettings />
        </div>
      </Card>
      <Card accent='#323E48' className='mt-4'>
        <h2 style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          {t('dashboard.tax.tax-registrations')}
        </h2>
        <div id='connect-tax-registrations'>
          <ConnectTaxRegistrations />
        </div>
      </Card>
      <Card accent='#4D5761' className='mt-4'>
        <h2 style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          {t('dashboard.tax.export-tax-transactions')}
        </h2>
        <div id='connect-export-tax-transactions'>
          <ConnectExportTaxTransactions />
        </div>
      </Card>
      <Card accent='#4D5761' className='mt-4'>
        <h2 style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
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
