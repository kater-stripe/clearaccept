'use client';

import { Card } from '@/components/common/Card';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ConnectBalances,
  ConnectCapitalFinancingPromotion,
  ConnectInstantPayoutsPromotion,
  ConnectRecipients,
} from '@stripe/react-connect-js';
import { getLatestFinancingOffer as getLatestFinancingOfferAction } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { getFinancialAccounts as getFinancialAccountsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccounts';
import { getFinancialAccountTransactions as getFinancialAccountTransactionsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccountTransactions';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/formatPrice';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import {
  BuildingLibraryIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CreditCardIcon,
  BriefcaseIcon,
  ArrowPathRoundedSquareIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { stripeSecretKey, capitalFinancingPromotionLayout, language } = useDemoConfig();
  const { account, isCapitalEligible } = useDemoMerchant();
  const router = useRouter();

  const { data: latestFinancingOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () =>
      getLatestFinancingOfferAction({ accountId: account!.id, stripeSecretKey }),
    enabled: isCapitalEligible,
  });

  const shouldShowPromotion =
    latestFinancingOffer?.status !== 'paid_out' &&
    latestFinancingOffer?.status !== 'completed' &&
    latestFinancingOffer?.status !== 'accepted' &&
    latestFinancingOffer?.status !== 'rejected';

  const [isInstantPayoutsPromotionShown, setIsInstantPayoutsPromotionShown] = useState(false);

  const { data: financialAccounts } = useQuery({
    queryKey: ['financial-accounts', account?.id, stripeSecretKey],
    queryFn: () => getFinancialAccountsAction({ accountId: account!.id, stripeSecretKey }),
    enabled: !!account,
  });

  const primaryFA = financialAccounts?.[0];

  const { data: transactions } = useQuery({
    queryKey: ['financial-account-transactions', primaryFA?.id],
    queryFn: () =>
      getFinancialAccountTransactionsAction({
        financialAccountId: primaryFA!.id,
        stripeSecretKey,
        accountId: account!.id,
      }),
    enabled: !!primaryFA,
  });

  const walletBalance = useMemo(() => {
    if (!primaryFA?.balance?.available) return null;
    const entries = Object.entries(primaryFA.balance.available);
    return entries.length > 0 ? entries[0][1] : null;
  }, [primaryFA]);

  const fmt = (value: number, currency: string) =>
    formatPrice(value, language as SupportedLanguage, currency as CurrencyCode);

  const recentTransactions = transactions?.slice(0, 5) ?? [];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      received_credit: 'Settlement received',
      outbound_payment: 'Outbound payment',
      outbound_transfer: 'Transfer out',
      inbound_transfer: 'Transfer in',
      stripe_fee: 'Fee',
      adjustment: 'Adjustment',
    };
    return labels[category] || category;
  };

  const VERBS = [
    {
      icon: <BuildingLibraryIcon className='size-5' />,
      label: 'Store',
      description: 'Multi-currency wallet',
      color: 'text-blue-600 bg-blue-50',
      href: `/${language}/dashboard/wallet`,
    },
    {
      icon: <SparklesIcon className='size-5' />,
      label: 'Earn',
      description: 'Yield on balances',
      color: 'text-amber-600 bg-amber-50',
      href: `/${language}/dashboard/wallet`,
    },
    {
      icon: <ArrowPathRoundedSquareIcon className='size-5' />,
      label: 'Convert',
      description: 'Instant FX',
      color: 'text-purple-600 bg-purple-50',
      href: `/${language}/dashboard/wallet`,
    },
    {
      icon: <ArrowUpRightIcon className='size-5' />,
      label: 'Send',
      description: 'Pay anyone via FPS',
      color: 'text-green-600 bg-green-50',
      href: `/${language}/dashboard/suppliers`,
    },
    {
      icon: <CreditCardIcon className='size-5' />,
      label: 'Spend',
      description: 'Corporate card',
      color: 'text-rose-600 bg-rose-50',
      href: `/${language}/dashboard/cards`,
    },
    {
      icon: <BriefcaseIcon className='size-5' />,
      label: 'Borrow',
      description: 'Merchant finance',
      color: 'text-indigo-600 bg-indigo-50',
      href: `/${language}/dashboard/capital`,
    },
  ];

  return (
    <div className='space-y-4'>
      {/* 6-verb platform tiles */}
      <div className='grid grid-cols-3 sm:grid-cols-6 gap-3'>
        {VERBS.map((verb) => (
          <button
            key={verb.label}
            onClick={() => router.push(verb.href)}
            className='flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-brand-primary hover:shadow-sm transition-all group text-center'
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${verb.color}`}>
              {verb.icon}
            </div>
            <div>
              <p className='text-sm font-semibold text-gray-900 group-hover:text-brand-primary transition-colors'>{verb.label}</p>
              <p className='text-xs text-gray-400 leading-tight mt-0.5'>{verb.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className='grid grid-cols-12 gap-4'>
        {/* Wallet balance + recent transactions */}
        <div className='col-span-12 lg:col-span-5 space-y-4'>
          {primaryFA && walletBalance && (
            <Card
              className='cursor-pointer hover:border-brand-primary transition-colors'
              onClick={() => router.push(`/${language}/dashboard/wallet`)}
            >
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>ClearAccept Wallet</p>
                  <p className='text-3xl font-bold text-gray-900 tracking-tight'>
                    {fmt(walletBalance.value ?? 0, walletBalance.currency)}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>Available balance</p>
                </div>
                <ArrowRightIcon className='size-4 text-gray-400 mt-1' />
              </div>
              {recentTransactions.length > 0 && (
                <div className='space-y-2 pt-3 border-t border-gray-100'>
                  {recentTransactions.map((tx) => {
                    const impact = tx.balance_impact?.available?.value ?? 0;
                    const isCredit = impact >= 0;
                    return (
                      <div key={tx.id} className='flex items-center justify-between'>
                        <p className='text-xs text-gray-600'>{getCategoryLabel(tx.category)}</p>
                        <p className={`text-xs font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : ''}{fmt(impact, tx.balance_impact?.available?.currency ?? tx.amount?.currency ?? 'gbp')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Quick actions */}
          <Card>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>Quick actions</h3>
            <div className='grid grid-cols-2 gap-2'>
              {[
                { label: 'Pay a supplier', icon: <BanknotesIcon className='size-4' />, href: `/${language}/dashboard/suppliers` },
                { label: 'Issue a card', icon: <CreditCardIcon className='size-4' />, href: `/${language}/dashboard/cards` },
                { label: 'View authorizations', icon: <CurrencyDollarIcon className='size-4' />, href: `/${language}/dashboard/authorizations` },
                { label: 'Get financing', icon: <BriefcaseIcon className='size-4' />, href: `/${language}/dashboard/capital` },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className='flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:border-brand-primary hover:bg-white text-left transition-colors group'
                >
                  <span className='text-gray-500 group-hover:text-brand-primary transition-colors'>{action.icon}</span>
                  <span className='text-xs font-medium text-gray-700 group-hover:text-brand-primary transition-colors'>{action.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Stripe Connect components */}
        <div className='col-span-12 lg:col-span-7 space-y-4'>
          <Card>
            <h2 className='text-lg font-semibold mb-4'>{t('dashboard.home.balances')}</h2>
            <ConnectBalances />
          </Card>

          <Card className={`${isInstantPayoutsPromotionShown ? 'visible' : 'hidden'}`}>
            <div id='connect-instant-payouts-promotion'>
              <ConnectInstantPayoutsPromotion
                onInstantPayoutsPromotionLoaded={({ promotionShown }) =>
                  setIsInstantPayoutsPromotionShown(promotionShown)
                }
              />
            </div>
            <ConnectRecipients dataSource='customers' />
          </Card>

          <Card>
            <h2 className='text-lg font-semibold mb-4'>{t('dashboard.home.capital')}</h2>
            <div id='connect-capital-financing-promotion'>
              <ConnectCapitalFinancingPromotion layout='banner' />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
