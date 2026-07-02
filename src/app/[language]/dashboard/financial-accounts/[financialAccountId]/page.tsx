'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { getFinancialAccount as getFinancialAccountAction } from '@/app/api/money-management/financial-accounts/getFinancialAccount';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getFinancialAccountTransactions as getFinancialAccountTransactionsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccountTransactions';
import { getFinancialAddresses as getFinancialAddressesAction } from '@/app/api/money-management/financial-addresses/getFinancialAddresses';
import { createFinancialAddress as createFinancialAddressAction } from '@/app/api/money-management/financial-addresses/createFinancialAddress';
import { formatPrice } from '@/utils/formatPrice';
import { MoveMoneyModal } from '@/components/financial-account/MoveMoneyModal';
import { TransferModal } from '@/components/financial-account/TransferModal';
import { PaymentModal } from '@/components/financial-account/PaymentModal';
import { UseForPayoutsModal } from '@/components/financial-account/UseForPayoutsModal';
import { getBalanceSettings as getBalanceSettingsAction } from '@/app/api/balance-settings/getBalanceSettings';
import { fundFinancialAccount as fundFinancialAccountAction } from '@/app/api/money-management/financial-accounts/fundFinancialAccount';
import { CardsList } from '@/components/issuing/CardsList';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type FATab = 'transactions' | 'cards';

const FinancialAccountPage = () => {
  const { financialAccountId } = useParams<{ financialAccountId: string }>();

  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();
  const router = useRouter();

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isMoveMoneyModalOpen, setIsMoveMoneyModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUseForPayoutsModalOpen, setIsUseForPayoutsModalOpen] =
    useState(false);
  const [showFullAccountNumber, setShowFullAccountNumber] = useState(false);
  const [activeTab, setActiveTab] = useState<FATab>('transactions');
  const [isTopUpPending, setIsTopUpPending] = useState(false);

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

  // Check if automatic payouts are configured for this FA
  const { data: balanceSettings } = useQuery({
    queryKey: ['balance-settings', account?.id],
    queryFn: () =>
      getBalanceSettingsAction({
        stripeSecretKey,
        accountId: account!.id,
      }),
    enabled: !!account,
  });

  // Fetch financial addresses for this FA
  const { data: financialAddresses } = useQuery({
    queryKey: ['financial-addresses', financialAccountId, stripeSecretKey],
    queryFn: () =>
      getFinancialAddressesAction({
        financialAccountId,
        stripeSecretKey,
        accountId: account!.id,
      }),
    enabled: !!account,
  });

  // Check if a financial address exists
  const hasFinancialAddress = financialAddresses && financialAddresses.length > 0;

  // Get account number info from financial address
  const { addressLast4, fullAccountNumber } = (() => {
    const financialAddress = financialAddresses?.[0];
    if (!financialAddress) return { addressLast4: null, fullAccountNumber: null };
    if (financialAddress?.credentials?.type === 'gb_bank_account') {
      return {
        addressLast4: financialAddress.credentials.gb_bank_account?.last4 ?? null,
        fullAccountNumber: financialAddress.credentials.gb_bank_account?.account_number ?? null,
      };
    } else if (financialAddress?.credentials?.type === 'us_bank_account') {
      return {
        addressLast4: financialAddress.credentials.us_bank_account?.last4 ?? null,
        fullAccountNumber: financialAddress.credentials.us_bank_account?.account_number ?? null,
      };
    }
    return { addressLast4: null, fullAccountNumber: null };
  })();

  // Mutation for creating a financial address
  const { mutate: createAddress, isPending: isCreatingAddress } = useMutation({
    mutationFn: createFinancialAddressAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['financial-addresses', financialAccountId],
      });
    },
  });

  // Get the merchant country for creating financial address
  const merchantCountry = (account?.identity?.country?.toUpperCase() ?? 'US') as
    | 'US'
    | 'GB';

  const handleCreateAddress = () => {
    if (!account) return;
    createAddress({
      accountId: account.id,
      financialAccountId,
      country: merchantCountry,
      stripeSecretKey,
    });
  };

  const handleTopUp = async () => {
    if (!account || !financialAddresses || financialAddresses.length === 0) return;
    const faAddr = financialAddresses[0];
    const faCurrency = financialAccount?.storage?.holds_currencies?.[0] ?? 'gbp';
    // Top up £500 (or $500) as a demo amount — 50000 in minor units
    const topUpAmount = 50000;

    setIsTopUpPending(true);
    try {
      await fundFinancialAccountAction({
        accountId: account.id,
        financialAccountId,
        financialAddressId: (faAddr as any).id,
        amount: topUpAmount,
        currency: faCurrency,
        stripeSecretKey,
      });
      queryClient.invalidateQueries({ queryKey: ['financial-account', financialAccountId] });
      queryClient.invalidateQueries({ queryKey: ['financial-account-transactions', financialAccountId] });
    } finally {
      setIsTopUpPending(false);
    }
  };

  // Check if this FA is currently set up for automatic payouts
  // Structure: payments.payouts.automatic_transfer_rules_by_currency[currency][0].payout_method
  const isAutoPayoutsEnabled = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rules = (balanceSettings?.payments?.payouts as any)?.automatic_transfer_rules_by_currency;
    if (!rules) return false;

    // Check all currencies for a rule pointing to this FA
    return Object.values(rules).some((currencyRules) =>
      (currencyRules as Array<{ payout_method: string }>)?.some(
        (rule) => rule.payout_method === financialAccountId,
      ),
    );
  })();

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
      {/* Move Money Modals */}
      {financialAccount && (
        <>
          <MoveMoneyModal
            open={isMoveMoneyModalOpen}
            onClose={() => setIsMoveMoneyModalOpen(false)}
            financialAccount={financialAccount}
            onSelectTransfer={() => setIsTransferModalOpen(true)}
            onSelectPayment={() => setIsPaymentModalOpen(true)}
          />
          <TransferModal
            open={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            sourceFinancialAccount={financialAccount}
          />
          <PaymentModal
            open={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            sourceFinancialAccount={financialAccount}
          />
          <UseForPayoutsModal
            open={isUseForPayoutsModalOpen}
            onClose={() => setIsUseForPayoutsModalOpen(false)}
            financialAccount={financialAccount}
            isCurrentlyEnabled={isAutoPayoutsEnabled}
          />
        </>
      )}

      {/* Header */}
      <div className='flex items-center gap-4'>
        <button
          onClick={() =>
            router.push(`/${language}/dashboard/financial-accounts`)
          }
          className='p-2 hover:bg-gray-100 rounded-md transition-colors'
        >
          <ArrowLeftIcon className='size-5' />
        </button>
        <h2 className='text-lg font-semibold'>
          {t('dashboard.expenses.financial-account.title')}
        </h2>
      </div>

      {/* Balances Card - Stripe Dashboard Style */}
      <Card>
        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-semibold'>
                {financialAccount?.display_name ||
                  t('dashboard.expenses.financial-account.overview')}
              </h2>
              {isAutoPayoutsEnabled && (
                <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                  {t('dashboard.expenses.financial-account.auto-payouts-active')}
                </span>
              )}
            </div>
            {addressLast4 ? (
              <button
                onClick={() => setShowFullAccountNumber(!showFullAccountNumber)}
                className='text-sm text-gray-500 mt-0.5 hover:underline'
              >
                {showFullAccountNumber && fullAccountNumber
                  ? fullAccountNumber
                  : `••••${addressLast4}`}
              </button>
            ) : hasFinancialAddress ? (
              <p className='text-sm text-gray-400 mt-0.5'>Account number pending</p>
            ) : (
              <button
                onClick={handleCreateAddress}
                disabled={isCreatingAddress}
                className='text-sm text-brand-primary hover:underline mt-0.5 disabled:text-gray-400 disabled:no-underline'
              >
                {isCreatingAddress ? 'Requesting...' : 'Request account number'}
              </button>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={handleTopUp}
              disabled={isAccountPending || !financialAccount || !hasFinancialAddress || isTopUpPending}
              colorMode='dark'
            >
              {isTopUpPending ? 'Topping up...' : 'Top Up'}
            </Button>
            <Button
              onClick={() => setIsUseForPayoutsModalOpen(true)}
              disabled={isAccountPending || !financialAccount}
              colorMode='dark'
            >
              {isAutoPayoutsEnabled
                ? t('dashboard.expenses.financial-account.manage-auto-payouts')
                : t('dashboard.expenses.financial-account.use-for-payouts')}
            </Button>
            <Button
              onClick={() => setIsMoveMoneyModalOpen(true)}
              disabled={isAccountPending || !financialAccount}
            >
              {t('dashboard.expenses.financial-account.move-money')}
            </Button>
          </div>
        </div>

        {isAccountPending ? (
          <div className='mt-4'>
            <Skeleton className='h-4 w-28 mb-2' />
            <Skeleton className='h-10 w-40' />
          </div>
        ) : financialAccount?.balance ? (
          <div className='mt-4'>
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
                              {formatBalanceAmount(
                                balance?.value,
                                balance?.currency,
                              )}
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
                              {formatBalanceAmount(
                                balance?.value,
                                balance?.currency,
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <p className='text-gray-500 text-sm mt-4'>
            No balance information available
          </p>
        )}

      </Card>

      {/* Tabs */}
      <Card>
        <div className='border-b border-gray-200 mb-4'>
          <nav className='-mb-px flex space-x-6'>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t('dashboard.expenses.financial-account.transactions')}
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'cards'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t('dashboard.expenses.issuing-cards')}
            </button>
          </nav>
        </div>

        {/* Transactions Tab Content */}
        {activeTab === 'transactions' && (
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
                          <td className='whitespace-nowrap px-3 py-4 text-sm font-medium'>
                            {(() => {
                              const balanceImpact = transaction.balance_impact?.available?.value ?? 0;
                              const isDebit = balanceImpact < 0;
                              const displayValue = isDebit
                                ? -(transaction.amount?.value ?? 0)
                                : (transaction.amount?.value ?? 0);
                              return (
                                <span className={isDebit ? 'text-red-600' : 'text-green-600'}>
                                  {isDebit ? '' : '+'}
                                  {formatBalanceAmount(
                                    displayValue,
                                    transaction.amount?.currency,
                                  )}
                                </span>
                              );
                            })()}
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
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
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
        )}

        {/* Issuing Cards Tab Content */}
        {activeTab === 'cards' && (
          <CardsList
            financialAccountId={financialAccountId}
            showCreateButton
            onCardClick={(card) =>
              router.push(`/${language}/dashboard/cards/${card.id}`)
            }
          />
        )}
      </Card>
    </div>
  );
};

export default FinancialAccountPage;
