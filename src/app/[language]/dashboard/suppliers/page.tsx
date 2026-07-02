'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getRecipients as getRecipientsAction } from '@/app/api/accounts/getRecipients';
import { getFinancialAccounts as getFinancialAccountsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccounts';
import { getOutboundPayments as getOutboundPaymentsAction } from '@/app/api/money-management/outbound-payments/getOutboundPayments';
import { formatPrice } from '@/utils/formatPrice';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { PaymentModal } from '@/components/financial-account/PaymentModal';
import { AddRecipientModal } from '@/components/financial-account/AddRecipientModal';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import type { Stripe } from 'stripe';
import {
  UserGroupIcon,
  PlusIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

const SuppliersPage = () => {
  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
  const [preselectedRecipient, setPreselectedRecipient] = useState<string | null>(null);

  const { data: recipients, isPending: isRecipientsLoading } = useQuery({
    queryKey: ['recipients', account?.id, stripeSecretKey],
    queryFn: () => getRecipientsAction({ connectedAccountId: account!.id, stripeSecretKey }),
    enabled: !!account,
  });

  const { data: financialAccounts } = useQuery({
    queryKey: ['financial-accounts', account?.id, stripeSecretKey],
    queryFn: () => getFinancialAccountsAction({ accountId: account!.id, stripeSecretKey }),
    enabled: !!account,
  });

  const primaryFA = financialAccounts?.[0];

  const { data: outboundPayments, isPending: isPaymentsLoading } = useQuery({
    queryKey: ['outbound-payments', account?.id, primaryFA?.id, stripeSecretKey],
    queryFn: () =>
      getOutboundPaymentsAction({
        accountId: account!.id,
        financialAccountId: primaryFA?.id,
        stripeSecretKey,
      }),
    enabled: !!account && !!primaryFA,
    refetchInterval: 5_000,
  });

  const fmt = (value: number, currency: string) =>
    formatPrice(value, language as SupportedLanguage, currency as CurrencyCode);

  const statusClass = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRecipientName = (recipientId: string) => {
    const r = recipients?.find((rec) => rec.id === recipientId);
    return r?.display_name ?? r?.contact_email ?? recipientId.slice(-8);
  };

  return (
    <div className='space-y-4'>
      {/* Recipient list */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h2 className='text-lg font-semibold'>Suppliers & Recipients</h2>
            <p className='text-sm text-gray-500 mt-0.5'>
              Registered bank accounts you can pay in one click
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => setIsAddRecipientModalOpen(true)}
              colorMode='dark'
            >
              <PlusIcon className='size-4' />
              Add supplier
            </Button>
            <Button
              onClick={() => { setPreselectedRecipient(null); setIsPaymentModalOpen(true); }}
              disabled={!primaryFA}
            >
              <BanknotesIcon className='size-4' />
              Pay a supplier
            </Button>
          </div>
        </div>

        {isRecipientsLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className='h-24 rounded-lg' />
            ))}
          </div>
        ) : recipients && recipients.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {recipients.map((r) => {
              const name = r.display_name ?? r.contact_email ?? 'Unknown';
              const email = r.contact_email;
              return (
                <div
                  key={r.id}
                  className='flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-brand-primary hover:bg-gray-50 transition-colors'
                >
                  <div className='flex-shrink-0 w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center'>
                    <BuildingOffice2Icon className='size-5 text-brand-primary' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-900 truncate'>{name}</p>
                    {email && <p className='text-xs text-gray-400 truncate'>{email}</p>}
                    <button
                      onClick={() => {
                        setPreselectedRecipient(r.id);
                        setIsPaymentModalOpen(true);
                      }}
                      disabled={!primaryFA}
                      className='mt-2 text-xs font-medium text-brand-primary hover:underline disabled:text-gray-400 disabled:no-underline'
                    >
                      Pay →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='py-10 text-center'>
            <UserGroupIcon className='mx-auto size-10 text-gray-300 mb-3' />
            <p className='text-sm text-gray-500'>No suppliers yet</p>
            <p className='text-xs text-gray-400 mt-1'>Add a supplier's bank account to start paying them from your wallet</p>
            <Button
              className='mt-4 mx-auto'
              onClick={() => setIsAddRecipientModalOpen(true)}
            >
              <PlusIcon className='size-4' />
              Add first supplier
            </Button>
          </div>
        )}
      </Card>

      {/* Payment history */}
      <Card>
        <h2 className='text-lg font-semibold mb-4'>Payment history</h2>

        <div className='flow-root'>
          <div className='-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
            <div className='inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:pl-6'>Date</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Recipient</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Description</th>
                    <th className='px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500'>Amount</th>
                    <th className='px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 bg-white'>
                  {isPaymentsLoading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(5)].map((_, j) => (
                            <td key={j} className='px-3 py-4'><Skeleton className='h-4 w-28' /></td>
                          ))}
                        </tr>
                      ))
                    : outboundPayments && outboundPayments.length > 0
                      ? outboundPayments.map((p) => (
                          <tr key={p.id} className='hover:bg-gray-50'>
                            <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6'>
                              {new Date(p.created).toLocaleDateString(language, {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </td>
                            <td className='whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900'>
                              {getRecipientName(p.to?.recipient ?? '')}
                            </td>
                            <td className='px-3 py-4 text-sm text-gray-500 max-w-[200px] truncate'>
                              {p.description ?? '—'}
                            </td>
                            <td className='whitespace-nowrap px-3 py-4 text-sm font-semibold text-red-600 text-right'>
                              −{fmt(p.amount?.value ?? 0, p.amount?.currency ?? 'gbp')}
                            </td>
                            <td className='whitespace-nowrap px-3 py-4 text-sm'>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(p.status)}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      : (
                        <tr>
                          <td colSpan={5} className='py-10 text-center text-sm text-gray-500'>
                            No outbound payments yet
                          </td>
                        </tr>
                      )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Modals */}
      {primaryFA && (
        <PaymentModal
          open={isPaymentModalOpen}
          onClose={() => { setIsPaymentModalOpen(false); setPreselectedRecipient(null); }}
          sourceFinancialAccount={primaryFA as Stripe.V2.MoneyManagement.FinancialAccount}
        />
      )}
      <AddRecipientModal
        open={isAddRecipientModalOpen}
        onClose={() => setIsAddRecipientModalOpen(false)}
        onSuccess={() => setIsAddRecipientModalOpen(false)}
        onRecipientCreated={() => {}}
      />
    </div>
  );
};

export default SuppliersPage;
