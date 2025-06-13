'use client';

import SubNav from '@/app/components/SubNav';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {useAccount} from '@/app/contexts/AccountContext';
import {useTranslation} from 'react-i18next';

export default function FinancesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {t} = useTranslation();

  const {
    account,
    error: useAccountError,
    loading: accountLoading,
  } = useAccount();
  const {settings} = useConfigContext();

  const displayIssuing =
    !useAccountError &&
    !accountLoading &&
    account &&
    account.card_issuing_enabled;
  const displayCapital =
    !useAccountError && !accountLoading && account && account.treasury_enabled;

  const routes = [
    {
      path: `/${settings?.language}/finances`,
      label: t('dashboard.finances.overview'),
    },
  ];
  if (displayIssuing) {
    routes.push({
      path: `/${settings?.language}/finances/cards`,
      label: t('dashboard.finances.cards'),
    });
  }

  return (
    <>
      <header className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold">
          {t('dashboard.finances.finances')}
        </h1>
        <SubNav base={`/${settings?.language}/finances`} routes={routes} />
      </header>
      {children}
    </>
  );
}
