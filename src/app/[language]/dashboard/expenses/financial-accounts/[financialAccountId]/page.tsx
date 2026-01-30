'use client';

import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { getFinancialAccount as getFinancialAccountAction } from '@/app/api/financial-accounts/getFinancialAccount';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getFinancialAccountTransactions as getFinancialAccountTransactionsAction } from '@/app/api/financial-accounts/getFinancialAccountTransactions';
import { formatPrice } from '@/utils/formatPrice';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';

const FinancialAccountPage = () => {
  const { financialAccountId } = useParams<{ financialAccountId: string }>();

  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();

  const { t } = useTranslation();

  const { data: financialAccount, isPending: isAccountPending } = useQuery({
    queryKey: ['financial-account', financialAccountId],
    queryFn: () =>
      getFinancialAccountAction({
        financialAccountId,
        stripeSecretKey,
        accountId: account!.id,
      }),
    enabled: !!account,
  });

  const { data: transactions, isPending: isTransactionsPending } = useQuery({
    queryKey: ['financial-account-transactions', financialAccountId],
    queryFn: () =>
      getFinancialAccountTransactionsAction({
        financialAccountId,
        stripeSecretKey,
        accountId: account!.id,
      }),
    enabled: !!account,
  });

  const formatBalanceAmount = (
    value: number | undefined,
    currency: string | undefined,
  ) => {
    if (value === undefined || currency === undefined) return '-';
    return formatPrice(
      value,
      language as SupportedLanguage,
      currency as CurrencyCode,
    );
  };

  const formatTransactionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      adjustment: 'Adjustment',
      currency_conversion: 'Currency Conversion',
      inbound_transfer: 'Inbound Transfer',
      outbound_payment: 'Outbound Payment',
      outbound_transfer: 'Outbound Transfer',
      received_credit: 'Received Credit',
      received_debit: 'Received Debit',
      return: 'Return',
      stripe_fee: 'Stripe Fee',
    };
    return labels[category] || category;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'void':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate total balance from available balances
  const getTotalBalance = () => {
    if (!financialAccount?.balance?.available) return null;
    const entries = Object.entries(financialAccount.balance.available);
    if (entries.length === 0) return null;
    // Return the first currency's balance as total (typically there's one currency)
    const [, balance] = entries[0];
    return balance;
  };

  const totalBalance = getTotalBalance();

  return (
    <div className='space-y-4'>
      {/* Balances Card - Stripe Dashboard Style */}
      <Card>
        <h2 className='text-lg font-semibold mb-4'>
          {financialAccount?.display_name ||
            t('dashboard.expenses.financial-account.overview')}
        </h2>

        {isAccountPending ? (
          <div>
            <Skeleton className='h-4 w-28 mb-2' />
            <Skeleton className='h-10 w-40' />
          </div>
        ) : financialAccount?.balance ? (
          <div>
            {/* Top Section - Available Balance */}
            <div>
              <p className='text-sm text-gray-500 mb-1'>Available balance</p>
              <p className='text-3xl font-semibold text-gray-900'>
                {totalBalance
                  ? formatBalanceAmount(
                    totalBalance.value,
                    totalBalance.currency,
                  )
                  : formatBalanceAmount(0, 'usd')}
              </p>
            </div>

            {/* Pending Balances */}
            {(Object.keys(financialAccount.balance.inbound_pending || {})
              .length > 0 ||
              Object.keys(financialAccount.balance.outbound_pending || {})
                .length > 0) && (
                <div className='border-t border-gray-200 pt-4 mt-4'>
                  <div className='flex gap-12'>
                    {Object.keys(financialAccount.balance.inbound_pending || {})
                      .length > 0 && (
                        <div>
                          <p className='text-sm text-gray-500 mb-1'>
                            Inbound pending
                          </p>
                          {Object.entries(
                            financialAccount.balance.inbound_pending,
                          ).map(([currency, balance]) => (
                            <p
                              key={currency}
                              className='text-lg font-semibold text-gray-900'
                            >
                              {formatBalanceAmount(balance?.value, balance?.currency)}
                            </p>
                          ))}
                        </div>
                      )}

                    {Object.keys(financialAccount.balance.outbound_pending || {})
                      .length > 0 && (
                        <div>
                          <p className='text-sm text-gray-500 mb-1'>
                            Outbound pending
                          </p>
                          {Object.entries(
                            financialAccount.balance.outbound_pending,
                          ).map(([currency, balance]) => (
                            <p
                              key={currency}
                              className='text-lg font-semibold text-gray-900'
                            >
                              {formatBalanceAmount(balance?.value, balance?.currency)}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <p className='text-gray-500 text-sm'>
            No balance information available
          </p>
        )}
      </Card>

      {/* Transactions Table */}
      <Card>
        <h2 className='text-lg font-semibold mb-4'>
          {t('dashboard.expenses.financial-account.transactions')}
        </h2>
        <div className='flow-root'>
          <div className='-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
            <div className='inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8'>
              <div className='overflow-hidden shadow-sm ring-1 ring-black/5 sm:rounded-lg'>
                <table className='min-w-full divide-y divide-gray-300'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th
                        scope='col'
                        className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6'
                      >
                        Date
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        Category
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        Amount
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        Balance Impact
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white'>
                    {isTransactionsPending ? (
                      // Skeleton rows for loading state
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className='whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6'>
                            <Skeleton className='h-4 w-32' />
                          </td>
                          <td className='whitespace-nowrap px-3 py-4'>
                            <Skeleton className='h-4 w-28' />
                          </td>
                          <td className='whitespace-nowrap px-3 py-4'>
                            <Skeleton className='h-4 w-20' />
                          </td>
                          <td className='whitespace-nowrap px-3 py-4'>
                            <Skeleton className='h-4 w-24' />
                          </td>
                          <td className='whitespace-nowrap px-3 py-4'>
                            <Skeleton className='h-5 w-16 rounded-full' />
                          </td>
                        </tr>
                      ))
                    ) : transactions && transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6'>
                            {formatTransactionDate(transaction.created)}
                          </td>
                          <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                            {getCategoryLabel(transaction.category)}
                          </td>
                          <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium'>
                            {formatBalanceAmount(
                              transaction.amount?.value,
                              transaction.amount?.currency,
                            )}
                          </td>
                          <td className='whitespace-nowrap px-3 py-4 text-sm'>
                            <div className='space-y-1'>
                              {transaction.balance_impact?.available?.value !==
                                0 && (
                                  <span
                                    className={`block ${(transaction.balance_impact?.available
                                      ?.value ?? 0) > 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                      }`}
                                  >
                                    Available:{' '}
                                    {(transaction.balance_impact?.available
                                      ?.value ?? 0) > 0
                                      ? '+'
                                      : ''}
                                    {formatBalanceAmount(
                                      transaction.balance_impact?.available
                                        ?.value,
                                      transaction.balance_impact?.available
                                        ?.currency,
                                    )}
                                  </span>
                                )}
                              {transaction.balance_impact?.inbound_pending
                                ?.value !== 0 && (
                                  <span className='block text-blue-600'>
                                    Inbound:{' '}
                                    {(transaction.balance_impact?.inbound_pending
                                      ?.value ?? 0) > 0
                                      ? '+'
                                      : ''}
                                    {formatBalanceAmount(
                                      transaction.balance_impact?.inbound_pending
                                        ?.value,
                                      transaction.balance_impact?.inbound_pending
                                        ?.currency,
                                    )}
                                  </span>
                                )}
                              {transaction.balance_impact?.outbound_pending
                                ?.value !== 0 && (
                                  <span className='block text-orange-600'>
                                    Outbound:{' '}
                                    {(transaction.balance_impact?.outbound_pending
                                      ?.value ?? 0) > 0
                                      ? '+'
                                      : ''}
                                    {formatBalanceAmount(
                                      transaction.balance_impact?.outbound_pending
                                        ?.value,
                                      transaction.balance_impact?.outbound_pending
                                        ?.currency,
                                    )}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className='whitespace-nowrap px-3 py-4 text-sm'>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                                transaction.status,
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className='py-8 text-center text-sm text-gray-500'
                        >
                          {t(
                            'dashboard.expenses.financial-account.no-transactions',
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialAccountPage;
