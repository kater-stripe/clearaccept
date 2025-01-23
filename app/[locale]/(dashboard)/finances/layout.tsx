'use client';

import SubNav from '@/app/components/SubNav';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {useAccount} from '@/app/hooks/useAccount';

export default function FinancesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    account,
    error: useAccountError,
    loading: accountLoading,
  } = useAccount();
  const {settings} = useConfigContext();

  if (!account || useAccountError) {
    return <></>;
  }

  const displayIssuing =
    !useAccountError &&
    !accountLoading &&
    account &&
    account.card_issuing_enabled;

  const routes = [{path: `/${settings?.language}/finances`, label: 'Overview'}];
  if (displayIssuing) {
    routes.push({
      path: `/${settings?.language}/finances/cards`,
      label: 'Cards',
    });
  }

  return (
    <>
      <header className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold">Finances</h1>
        <SubNav base={`/${settings?.language}/finances`} routes={routes} />
      </header>
      {children}
    </>
  );
}
