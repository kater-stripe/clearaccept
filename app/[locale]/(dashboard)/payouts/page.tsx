'use client';

import {ConnectPayouts} from '@stripe/react-connect-js';
import Container from '@/app/components/Container';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import {useTranslation} from 'react-i18next';

export default function Payouts() {
  const {t} = useTranslation();

  return (
    <>
      <h1 className="text-3xl font-bold">{t('dashboard.payouts.payouts')}</h1>
      <Container>
        <EmbeddedComponentContainer>
          <ConnectPayouts />
        </EmbeddedComponentContainer>
      </Container>
    </>
  );
}
