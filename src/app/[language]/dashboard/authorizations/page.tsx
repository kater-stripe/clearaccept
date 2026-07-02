'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getAuthorizations as getAuthorizationsAction } from '@/app/api/issuing/getAuthorizations';
import { formatPrice } from '@/utils/formatPrice';
import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const MCC_LABELS: Record<string, string> = {
  '5411': 'Groceries',
  '5812': 'Restaurants',
  '5541': 'Gas Stations',
  '5912': 'Drug Stores',
  '4111': 'Transport',
  '4121': 'Taxi / Rideshare',
  '4511': 'Airlines',
  '7011': 'Hotels',
  '5999': 'Retail',
  '7372': 'Software',
  '5734': 'Electronics',
  '8099': 'Medical',
  '5047': 'Healthcare',
  '5200': 'Home Improvement',
};

type FilterStatus = 'all' | 'pending' | 'closed' | 'reversed';

const AuthorizationsPage = () => {
  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const { data: authorizations, isPending } = useQuery({
    queryKey: ['issuing-authorizations', account?.id, stripeSecretKey],
    queryFn: () =>
      getAuthorizationsAction({ accountId: account!.id, stripeSecretKey }),
    enabled: !!account,
    refetchInterval: 10_000,
  });

  const fmt = (amount: number, currency: string) =>
    formatPrice(amount, language as SupportedLanguage, currency as CurrencyCode);

  const filtered =
    filter === 'all'
      ? authorizations
      : authorizations?.filter((a) => a.status === filter);

  const counts = {
    all: authorizations?.length ?? 0,
    pending: authorizations?.filter((a) => a.status === 'pending').length ?? 0,
    closed: authorizations?.filter((a) => a.status === 'closed').length ?? 0,
    reversed: authorizations?.filter((a) => a.status === 'reversed').length ?? 0,
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'reversed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const TABS: { label: string; value: FilterStatus }[] = [
    { label: `All (${counts.all})`, value: 'all' },
    { label: `Pending (${counts.pending})`, value: 'pending' },
    { label: `Closed (${counts.closed})`, value: 'closed' },
    { label: `Reversed (${counts.reversed})`, value: 'reversed' },
  ];

  return (
    <div className='space-y-4'>
      <Card>
        {/* Tabs */}
        <div className='border-b border-gray-200 mb-4'>
          <nav className='-mb-px flex space-x-6'>
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className='flow-root'>
          <div className='-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
            <div className='inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:pl-6'>Date</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Merchant</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Category</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Card</th>
                    <th className='px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500'>Amount</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 bg-white'>
                  {isPending
                    ? [...Array(8)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(6)].map((_, j) => (
                            <td key={j} className='px-3 py-4'>
                              <Skeleton className='h-4 w-24' />
                            </td>
                          ))}
                        </tr>
                      ))
                    : filtered && filtered.length > 0
                      ? filtered.map((auth) => {
                          const mcc = auth.merchant_data?.category_code ?? '';
                          const mccLabel = MCC_LABELS[mcc] ?? (mcc ? `MCC ${mcc}` : '—');
                          const cardLast4 = (auth.card as { last4?: string })?.last4;
                          return (
                            <tr key={auth.id} className='hover:bg-gray-50'>
                              <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6'>
                                {new Date(auth.created * 1000).toLocaleDateString(language, {
                                  month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </td>
                              <td className='whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900'>
                                {auth.merchant_data?.name ?? '—'}
                              </td>
                              <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                                {mccLabel}
                              </td>
                              <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono'>
                                {cardLast4 ? `••••${cardLast4}` : '—'}
                              </td>
                              <td className='whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 text-right'>
                                {fmt(auth.amount, auth.currency)}
                              </td>
                              <td className='whitespace-nowrap px-3 py-4 text-sm'>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(auth.status)}`}>
                                  {auth.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      : (
                        <tr>
                          <td colSpan={6} className='py-12 text-center'>
                            <ShieldCheckIcon className='mx-auto size-10 text-gray-300 mb-3' />
                            <p className='text-sm text-gray-500'>No authorizations yet</p>
                            <p className='text-xs text-gray-400 mt-1'>Card spend will appear here in real time</p>
                          </td>
                        </tr>
                      )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthorizationsPage;
