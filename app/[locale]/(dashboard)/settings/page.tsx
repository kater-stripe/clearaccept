'use client';

import {
  ConnectAccountManagement,
  ConnectTaxRegistrations,
  ConnectTaxSettings,
} from '@stripe/react-connect-js';
import Container from '@/app/components/Container';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import {useSession} from 'next-auth/react';
import {useTranslation} from 'react-i18next';

export default function Settings() {
  const {data: session} = useSession();
  const {t} = useTranslation();

  return (
    <>
      <Container className="px-5 py-4">
        <h1 className="mb-4 text-xl font-semibold">
          {t('dashboard.settings.basic_details')}
        </h1>
        <div className="flex flex-row space-x-20">
          <div>
            <div className="text-subdued">
              {t('dashboard.settings.studio_name')}
            </div>
            <div className="font-medium">
              {t('dashboard.settings.practice')}
            </div>
          </div>
          <div>
            <div className="text-subdued">{t('dashboard.settings.email')}</div>
            <div className="font-medium">{session?.user.email}</div>
          </div>
        </div>
      </Container>
      <Container>
        <header className="mb-8 ml-2">
          <h1 className="text-xl font-semibold">
            {t('dashboard.settings.account_settings')}
          </h1>
          <h2 className="text-subdued">
            {t('dashboard.settings.manage_account')}
          </h2>
        </header>
        <EmbeddedComponentContainer>
          <ConnectAccountManagement />
        </EmbeddedComponentContainer>
      </Container>
      <Container>
        <header className="mb-8 ml-2">
          <h1 className="text-xl font-semibold">
            {t('dashboard.settings.tax_settings')}
          </h1>
          <h2 className="text-subdued">
            {t('dashboard.settings.tax_account')}
          </h2>
        </header>
        <EmbeddedComponentContainer>
          <ConnectTaxSettings />
          <div className="h-8"> </div>
          <ConnectTaxRegistrations />
        </EmbeddedComponentContainer>
      </Container>
    </>
  );
}
