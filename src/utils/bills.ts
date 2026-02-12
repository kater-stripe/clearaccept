import type { FakeBill, FakeBillLineItem } from '@/types/fakeBill';

const SUPPLIER_BILLS: Array<{
  supplierName: string;
  lineItems: FakeBillLineItem[];
}> = [
  {
    supplierName: 'Acme Office Supplies',
    lineItems: [
      { description: 'Printer Paper (10 reams)', quantity: 10, unitAmount: 1299 },
      { description: 'Ink Cartridges', quantity: 4, unitAmount: 3499 },
    ],
  },
  {
    supplierName: 'CloudServe IT Solutions',
    lineItems: [
      { description: 'Monthly Cloud Hosting', quantity: 1, unitAmount: 29900 },
      { description: 'SSL Certificate Renewal', quantity: 1, unitAmount: 9900 },
    ],
  },
  {
    supplierName: 'Metro Cleaning Co.',
    lineItems: [
      { description: 'Office Cleaning - Weekly Service', quantity: 4, unitAmount: 15000 },
    ],
  },
];

export const generateBillId = (): string => {
  return `bill_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

export const generateInvoiceNumber = (): string => {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
};

export const calculateBillTotal = (lineItems: FakeBillLineItem[]): number => {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0);
};

export const createDefaultBills = (currency: string): FakeBill[] => {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60;

  return SUPPLIER_BILLS.map((template) => ({
    id: generateBillId(),
    supplierName: template.supplierName,
    invoiceNumber: generateInvoiceNumber(),
    amount: calculateBillTotal(template.lineItems),
    currency,
    status: 'open' as const,
    dueDate: thirtyDaysFromNow,
    lineItems: template.lineItems,
    createdAt: now,
  }));
};

export const getBillsStorageKey = (demoName: string, accountId: string): string => {
  return `${demoName}-bills-${accountId}`;
};
