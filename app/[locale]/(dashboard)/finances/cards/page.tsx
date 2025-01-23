'use client';

import {ConnectIssuingCardsList} from '@stripe/react-connect-js';
import Container from '@/app/components/Container';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import {useTranslation} from 'react-i18next';

export default function Finances() {
  const {t} = useTranslation();

  return (
    <Container>
      <h1 className="mb-1 ml-2 text-xl font-bold">
        {t('dashboard.finances.cards')}
      </h1>
      <EmbeddedComponentContainer>
        <ConnectIssuingCardsList />
      </EmbeddedComponentContainer>
    </Container>
  );
}
