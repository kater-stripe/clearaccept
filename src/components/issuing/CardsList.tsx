'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getCards as getCardsAction } from '@/app/api/issuing/getCards';
import { Skeleton } from '@/components/common/Skeleton';
import { CardRow } from './CardRow';
import type Stripe from 'stripe';

type CardTab = 'all' | 'active' | 'inactive' | 'canceled';

type CardsListProps = {
  onCardClick: (card: Stripe.Issuing.Card) => void;
};

export const CardsList = ({ onCardClick }: CardsListProps) => {
  const { stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<CardTab>('all');

  const statusFilter: Stripe.Issuing.Card.Status | undefined =
    activeTab === 'all' ? undefined : activeTab;

  const { data: cards, isPending: isCardsLoading } = useQuery({
    queryKey: ['issuing-cards', account?.id, stripeSecretKey, statusFilter],
    queryFn: () =>
      getCardsAction({
        accountId: account!.id,
        status: statusFilter,
        stripeSecretKey,
      }),
    enabled: !!account,
  });

  const tabs: { key: CardTab; label: string }[] = [
    { key: 'all', label: t('dashboard.issuing.tabs.all') },
    { key: 'active', label: t('dashboard.issuing.tabs.active') },
    { key: 'inactive', label: t('dashboard.issuing.tabs.inactive') },
    { key: 'canceled', label: t('dashboard.issuing.tabs.canceled') },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className='border-b border-gray-200 mb-4'>
        <nav className='-mb-px flex space-x-6'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
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
                      {t('dashboard.issuing.table.card')}
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                    >
                      {t('dashboard.issuing.table.cardholder')}
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                    >
                      {t('dashboard.issuing.table.currency')}
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                    >
                      {t('dashboard.issuing.table.funding')}
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                    >
                      {t('dashboard.issuing.table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {isCardsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className='whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6'>
                          <Skeleton className='h-4 w-28' />
                        </td>
                        <td className='whitespace-nowrap px-3 py-4'>
                          <Skeleton className='h-4 w-24' />
                        </td>
                        <td className='whitespace-nowrap px-3 py-4'>
                          <Skeleton className='h-4 w-12' />
                        </td>
                        <td className='whitespace-nowrap px-3 py-4'>
                          <Skeleton className='h-4 w-20' />
                        </td>
                        <td className='whitespace-nowrap px-3 py-4'>
                          <Skeleton className='h-5 w-16 rounded-full' />
                        </td>
                      </tr>
                    ))
                  ) : cards && cards.length > 0 ? (
                    cards.map((card) => (
                      <CardRow
                        key={card.id}
                        card={card}
                        onClick={onCardClick}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className='py-8 text-center text-sm text-gray-500'
                      >
                        {t('dashboard.issuing.no-cards')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

