'use client';

import { getBills, type Bill } from '@/app/api/invoices/getBills';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { formatPrice } from '@/utils/formatPrice';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from '@/constants/currencyCodes';

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    void: 'bg-red-100 text-red-800',
    uncollectible: 'bg-yellow-100 text-yellow-800',
};

const BillRow = ({ bill }: { bill: Bill }) => {
    const { language } = useDemoConfig();
    const { t } = useTranslation();
    const { invoice, supplierName } = bill;

    const dueDate = invoice.due_date
        ? new Date(invoice.due_date * 1000).toLocaleDateString(language)
        : '-';

    const canPay = invoice.status === 'open' && invoice.hosted_invoice_url;

    return (
        <tr key={invoice.id}>
            <td className='py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6'>
                {supplierName}
            </td>
            <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
                <div className='truncate'>
                    {invoice.number || `INV-${invoice.id.slice(-8).toUpperCase()}`}
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
            <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
                {canPay && (
                    <Button
                        onClick={() =>
                            window.open(invoice.hosted_invoice_url!, '_blank')
                        }
                    >
                        {t('dashboard.bills.table.pay')}
                    </Button>
                )}
            </td>
        </tr>
    );
};

const BillsPage = () => {
    const { t } = useTranslation();
    const { language, stripeSecretKey } = useDemoConfig();
    const { account } = useDemoMerchant();

    const { data: bills, isPending: isBillsLoading } = useQuery({
        queryKey: ['bills', account?.id, stripeSecretKey],
        queryFn: () =>
            getBills({
                accountId: account!.id,
                stripeSecretKey,
            }),
        enabled: !!account,
    });

    const hasBills = bills && bills.length > 0;

    return (
        <Card>
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
                                            {t('dashboard.bills.table.supplier')}
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                                        >
                                            {t('dashboard.bills.table.invoice-number')}
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                                        >
                                            {t('dashboard.bills.table.amount')}
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                                        >
                                            {t('dashboard.bills.table.status')}
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                                        >
                                            {t('dashboard.bills.table.due-date')}
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                                        >
                                            {t('dashboard.bills.table.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200 bg-white'>
                                    {isBillsLoading && (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className='flex items-center justify-center p-4'>
                                                    <LoadingSpinner className='size-6' />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {hasBills &&
                                        bills.map((bill) => (
                                            <BillRow key={bill.invoice.id} bill={bill} />
                                        ))}
                                    {!isBillsLoading && !hasBills && (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
                                                    <DocumentTextIcon className='size-12 mb-3' />
                                                    <p className='text-sm font-medium text-gray-500'>
                                                        {t('dashboard.bills.empty')}
                                                    </p>
                                                    <p className='text-sm text-gray-400 mt-1'>
                                                        {t('dashboard.bills.empty-description')}
                                                    </p>
                                                </div>
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
    );
};

export default BillsPage;
