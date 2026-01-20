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
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card>
          <div id='connect-reporting-chart'>
            <ConnectReportingChart reportName='net_volume' />
          </div>
        </Card>
        <Card>
          <div id='connect-reporting-chart'>
            <ConnectReportingChart reportName='gross_volume' />
          </div>
        </Card>
      </div>
      <Card className='mt-4'>
        <h2 className='text-lg font-semibold mb-4'>Documents</h2>
        <div id='connect-documents'>
          <ConnectDocuments />
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
