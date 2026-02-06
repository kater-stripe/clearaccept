'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { formatPrice } from '@/utils/formatPrice';
import { Button } from '../common/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInvoice as deleteInvoiceAction } from '@/app/api/invoices/deleteInvoice';
import { finalizeInvoice as finalizeInvoiceAction } from '@/app/api/invoices/finalizeInvoice';
import { sendInvoice as sendInvoiceAction } from '@/app/api/invoices/sendInvoice';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import type { Stripe } from 'stripe';
import { useState } from 'react';
import { CopyInvoiceLinkModal } from './CopyInvoiceLinkModal';
import { CurrencyCode } from '@/constants/currencyCodes';

type InvoiceRowProps = {
  invoice: Stripe.Invoice;
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  void: 'bg-red-100 text-red-800',
  uncollectible: 'bg-yellow-100 text-yellow-800',
};

export const InvoiceRow = ({ invoice }: InvoiceRowProps) => {
  const { language, chargeType, stripeSecretKey } = useDemoConfig();
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const queryClient = useQueryClient();

  const [invoiceLinkUrl, setInvoiceLinkUrl] = useState<string | null>(null);

  const { mutate: deleteInvoice, isPending: isDeletingInvoice } = useMutation({
    mutationFn: deleteInvoiceAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invoices', account?.id, stripeSecretKey, chargeType],
      });
    },
  });

  const { mutate: finalizeInvoice, isPending: isFinalizingInvoice } =
    useMutation({
      mutationFn: finalizeInvoiceAction,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['invoices', account?.id, stripeSecretKey, chargeType],
        });
      },
    });

  const { mutate: sendInvoice, isPending: isSendingInvoice } = useMutation({
    mutationFn: sendInvoiceAction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['invoices', account?.id, stripeSecretKey, chargeType],
      });
    },
  });

  const customer =
    typeof invoice.customer === 'object' &&
    invoice.customer &&
    !('deleted' in invoice.customer)
      ? invoice.customer
      : null;
  const customerName = customer?.name || customer?.email || 'Unknown';

  const canDelete = invoice.status === 'draft' || invoice.status === 'open';
  const canFinalize = invoice.status === 'draft';
  const canSend = invoice.status === 'open';
  const canCopyLink = invoice.hosted_invoice_url;
  const canDownload = invoice.invoice_pdf;

  const isLoading =
    isDeletingInvoice || isFinalizingInvoice || isSendingInvoice;

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date * 1000).toLocaleDateString(language)
    : '-';

  return (
    <>
      <CopyInvoiceLinkModal
        open={!!invoiceLinkUrl}
        onClose={() => setInvoiceLinkUrl(null)}
        url={invoiceLinkUrl!}
      />
      <tr key={invoice.id}>
        <td className='py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 max-w-xs'>
          <div className='break-words'>
            {invoice.number ||
              `${new Date(invoice.created * 1000).toISOString().split('T')[0]} Draft`}
          </div>
        </td>
        <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
          <div className='truncate' title={customerName}>
            {customerName}
          </div>
        </td>
        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
          {formatPrice(
            invoice.amount_due ?? 0,
            language,
            invoice.currency as CurrencyCode,
          )}
        </td>
        <td className='whitespace-nowrap px-3 py-4 text-sm'>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[invoice.status ?? 'draft']}`}
          >
            {invoice.status
              ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
              : 'Draft'}
          </span>
        </td>
        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
          {dueDate}
        </td>
        <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2 justify-end'>
          {canDownload && invoice.invoice_pdf && (
            <Button
              disabled={isLoading}
              onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
            >
              {t('dashboard.invoices.table.download')}
            </Button>
          )}
          {canCopyLink && invoice.hosted_invoice_url && (
            <Button
              disabled={isLoading}
              onClick={() => setInvoiceLinkUrl(invoice.hosted_invoice_url!)}
            >
              {t('dashboard.invoices.table.copy-link')}
            </Button>
          )}
          {canFinalize && (
            <Button
              disabled={isLoading}
              onClick={() =>
                finalizeInvoice({
                  invoiceId: invoice.id,
                  accountId: account!.id,
                  chargeType,
                  stripeSecretKey,
                })
              }
              className='bg-blue-600 hover:bg-blue-500 text-black'
            >
              {t('dashboard.invoices.table.finalize')}
            </Button>
          )}
          {/* {canSend && (
            <Button
              disabled={isLoading}
              onClick={() =>
                sendInvoice({
                  invoiceId: invoice.id,
                  accountId: account!.id,
                  chargeType,
                  stripeSecretKey,
                })
              }
              className='bg-green-600 hover:bg-green-500 text-white'
            >
              {t('dashboard.invoices.table.send')}
            </Button>
          )} */}
          {canDelete && (
            <Button
              disabled={isLoading}
              onClick={() =>
                deleteInvoice({
                  invoiceId: invoice.id,
                  accountId: account!.id,
                  chargeType,
                  stripeSecretKey,
                })
              }
              className='bg-red-600 hover:bg-red-500 text-white'
            >
              {t('dashboard.invoices.table.delete')}
            </Button>
          )}
        </td>
      </tr>
    </>
  );
};
