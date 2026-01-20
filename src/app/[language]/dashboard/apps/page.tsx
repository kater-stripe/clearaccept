'use client';

import { Card } from '@/components/common/Card';
import {
  ConnectAppInstall,
  ConnectAppViewport,
} from '@stripe/react-connect-js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const AppsPage = () => {
  const [isAcodeiQuickbooksSyncInstalled, setIsAcodeiQuickbooksSyncInstalled] =
    useState(false);
  // const [isXeroSyncInstalled, setIsXeroSyncInstalled] = useState(false);

  const { t } = useTranslation();

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <p className='font-semibold text-center mb-2'>
            {t('dashboard.apps.acodei-quickbooks-sync')}
          </p>
          <div id='connect-app-install'>
            <ConnectAppInstall
              app='com.example.acodeistripeapp'
              onAppInstallStateFetch={({ state }) => {
                setIsAcodeiQuickbooksSyncInstalled(state === 'INSTALLED');
              }}
              onAppInstallStateChange={({ state }) => {
                setIsAcodeiQuickbooksSyncInstalled(state === 'INSTALLED');
              }}
            />
          </div>
        </Card>

        {/* <Card
            style={{
              borderColor: primaryColor,
            }}
          >
            <p className='font-semibold text-center mb-2'>Xero Sync</p>
            <ConnectAppInstall
              app='com.xero.stripeapp'
              onAppInstallStateFetch={({ state }) => {
                setIsXeroSyncInstalled(state === 'INSTALLED');
              }}
              onAppInstallStateChange={({ state }) => {
                setIsXeroSyncInstalled(state === 'INSTALLED');
              }}
            />
          </Card> */}
      </div>
      {isAcodeiQuickbooksSyncInstalled && (
        <Card className='mt-4 pt-0'>
          <div id='connect-app-viewport'>
            <ConnectAppViewport app='com.example.acodeistripeapp' />
          </div>
        </Card>
      )}
      {/* {isXeroSyncInstalled && (
        <Card className='mt-4'>
          <ConnectAppViewport app='com.xero.stripeapp' />
        </Card>
      )} */}
    </div>
  );
};

export default AppsPage;
