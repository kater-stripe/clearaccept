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

const useFinancialAccount = () => {
  const [financialAccount, setFinancialAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/financial_account');
        const json = await response.json();
        setFinancialAccount(json.financial_account);
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
  if (!account || useAccountError) {
    return <></>;
  }

  const displayFinancialAccount =
    !useAccountError &&
    !accountLoading &&
    account &&
    account.treasury_enabled &&
    !useFinancialAccountError &&
    financialAccount &&
    !faLoading;

  const displayIssuing =
    !useAccountError &&
    !accountLoading &&
    account &&
    account.card_issuing_enabled;

  return (
    <>
      <Container>
        <EmbeddedComponentContainer>
          <ConnectCapitalOverview />
        </EmbeddedComponentContainer>
      </Container>
      {displayFinancialAccount && (
        <Container>
          <h1 className="mb-2 ml-2 text-xl font-bold">Financial account</h1>
          <EmbeddedComponentContainer>
            <ConnectFinancialAccount financialAccount={financialAccount} />
          </EmbeddedComponentContainer>
        </Container>
      )}
      {displayFinancialAccount && (
        <Container>
          <h1 className="ml-2 text-xl font-bold">Transactions</h1>
          <EmbeddedComponentContainer>
            <ConnectFinancialAccountTransactions
              financialAccount={financialAccount}
            />
          </EmbeddedComponentContainer>
        </Container>
      )}
    </>
  );
}
