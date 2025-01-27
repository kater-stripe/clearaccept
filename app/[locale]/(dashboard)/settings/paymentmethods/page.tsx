'use client';

import {ConnectPaymentMethodSettings} from '@stripe/react-connect-js';
import Container from '@/app/components/Container';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import {useTranslation} from 'react-i18next';

export default function PaymentMethods() {
  const {t} = useTranslation();

  return (
    <Container>
      <header className="mb-8 ml-2">
        <h1 className="text-xl font-semibold">
          {t('dashboard.settings.payment_methods')}
        </h1>
        <h2 className="text-subdued">
          {t('dashboard.settings.payment_methods_add')}
        </h2>
      </header>
      <EmbeddedComponentContainer>
        <ConnectPaymentMethodSettings />
      </EmbeddedComponentContainer>
    </Container>
  );
}
