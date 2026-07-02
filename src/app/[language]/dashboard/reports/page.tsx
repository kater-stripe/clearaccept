'use client';

import { Card } from '@/components/common/Card';
import {
  ConnectDocuments,
  ConnectReportingChart,
} from '@stripe/react-connect-js';
import { useTranslation } from 'react-i18next';

const ReportsPage = () => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        <Card accent='#77B32A'>
          <ConnectReportingChart reportName='net_volume' />
        </Card>
        <Card accent='#323E48'>
          <ConnectReportingChart reportName='gross_volume' />
        </Card>
      </div>
      <Card accent='#77B32A'>
        <div style={{ fontSize: 11, color: '#8892A0', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          Documents
        </div>
        <ConnectDocuments />
      </Card>
    </div>
  );
};

export default ReportsPage;
