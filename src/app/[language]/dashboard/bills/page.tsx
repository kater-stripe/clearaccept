'use client';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useFakeBills } from '@/hooks/useFakeBills';
import { formatPrice } from '@/utils/formatPrice';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { FakeBill } from '@/types/fakeBill';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
};

const BillRow = ({ bill }: { bill: FakeBill }) => {
  const { language } = useDemoConfig();
  const { t } = useTranslation();

  const dueDate = bill.dueDate
    ? new Date(bill.dueDate * 1000).toLocaleDateString(language)
    : '-';

  const canPay = bill.status === 'open';

  const handlePayClick = () => {
    window.open(`/${language}/bills/${bill.id}/pay`, '_blank');
  };

  return (
    <tr key={bill.id}>
      <td className='py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6'>
        {bill.supplierName}
      </td>
      <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
        <div className='truncate'>{bill.invoiceNumber}</div>
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        {formatPrice(bill.amount, language, bill.currency as CurrencyCode)}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm'>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[bill.status]}`}
        >
          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
        </span>
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        {dueDate}
      </td>
      <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
        {canPay && (
          <Button onClick={handlePayClick}>
            {t('dashboard.bills.table.pay')}
          </Button>
        )}
        {bill.status === 'paid' && (
          <Button onClick={handlePayClick}>
            {t('dashboard.bills.table.view')}
          </Button>
        )}
      </td>
    </tr>
  );
};

const BillsPage = () => {
  const { t } = useTranslation();
  const { bills } = useFakeBills();

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
                  {hasBills &&
                    bills.map((bill) => <BillRow key={bill.id} bill={bill} />)}
                  {!hasBills && (
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
