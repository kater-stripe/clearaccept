'use client';

import React, {useState, useEffect} from 'react';
import {
  ConnectCapitalOverview,
  ConnectFinancialAccount,
  ConnectFinancialAccountTransactions,
} from '@stripe/react-connect-js';
import Container from '@/app/components/Container';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import {useAccount} from '@/app/hooks/useAccount';
import {useTranslation} from 'react-i18next';
import fetchClient from '@/app/utils/fetchClient';
import {Spinner} from '@/app/components/ui';

const useFinancialAccount = () => {
  const [financialAccount, setFinancialAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {data} = await fetchClient.get('/api/financial-accounts');
        setFinancialAccount(data.financial_account);
        setLoading(false);
      } catch (error: any) {
        setError(error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return {loading, financialAccount, error};
};

export default function Finances() {
  const {t} = useTranslation();

  const {
    financialAccount,
    error: useFinancialAccountError,
    loading: faLoading,
  } = useFinancialAccount();

  const {
    account,
    error: useAccountError,
    loading: accountLoading,
  } = useAccount();

  const displayFinancialAccount =
    !useAccountError &&
    !accountLoading &&
    account &&
    account.treasury_enabled &&
    !useFinancialAccountError &&
    financialAccount &&
    !faLoading;

  return (
    <>
      <Container>
        <EmbeddedComponentContainer>
          {accountLoading ? (
            <div className="my-8 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <ConnectCapitalOverview />
          )}
        </EmbeddedComponentContainer>
      </Container>
      {(displayFinancialAccount || faLoading) && (
        <Container>
          <h1 className="mb-2 ml-2 text-xl font-bold">
            {t('dashboard.finances.financial_account')}
          </h1>
          <EmbeddedComponentContainer>
            {faLoading ? (
              <div className="my-8 flex justify-center">
                <Spinner />
              </div>
            ) : (
              <ConnectFinancialAccount financialAccount={financialAccount!} />
            )}
          </EmbeddedComponentContainer>
        </Container>
      )}
      {(displayFinancialAccount || faLoading) && (
        <Container>
          <h1 className="ml-2 text-xl font-bold">
            {t('dashboard.finances.transactions')}
          </h1>
          <EmbeddedComponentContainer>
            {faLoading ? (
              <div className="my-8 flex justify-center">
                <Spinner />
              </div>
            ) : (
              <ConnectFinancialAccountTransactions
                financialAccount={financialAccount!}
              />
            )}
          </EmbeddedComponentContainer>
        </Container>
      )}
    </>
  );
}
