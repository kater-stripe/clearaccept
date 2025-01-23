'use client';

import {ConnectPayments} from '@stripe/react-connect-js';
import Container from '@/app/components/Container';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import MonthToDateWidget from '@/app/components/MonthToDateWidget';
import CustomersWidget from '@/app/components/CustomersWidget';
import {useTranslation} from 'react-i18next';

export default function Payouts() {
  const {t} = useTranslation();

  return (
    <>
      <h1 className="text-3xl font-bold">{t('dashboard.payments.payments')}</h1>
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex-1">
          <MonthToDateWidget />
        </div>
        <div className="flex-1">
          <CustomersWidget />
        </div>
      </div>
      <Container>
        <h1 className="ml-2 text-xl font-bold">
          {t('dashboard.payments.recent')}
        </h1>
        <EmbeddedComponentContainer>
          <ConnectPayments />
        </EmbeddedComponentContainer>
      </Container>
    </>
  );
}
