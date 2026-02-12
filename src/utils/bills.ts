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
  {
    supplierName: 'TechHub Electronics',
    lineItems: [
      { description: 'USB-C Docking Stations', quantity: 5, unitAmount: 12999 },
      { description: 'Wireless Keyboards', quantity: 10, unitAmount: 4999 },
    ],
  },
  {
    supplierName: 'GreenLeaf Catering',
    lineItems: [
      { description: 'Team Lunch Catering', quantity: 1, unitAmount: 45000 },
      { description: 'Coffee Service - Monthly', quantity: 1, unitAmount: 8500 },
    ],
  },
  {
    supplierName: 'SecureNet Consulting',
    lineItems: [
      { description: 'Security Audit', quantity: 1, unitAmount: 250000 },
      { description: 'Penetration Testing', quantity: 1, unitAmount: 150000 },
    ],
  },
  {
    supplierName: 'Pinnacle Marketing Agency',
    lineItems: [
      { description: 'Social Media Management', quantity: 1, unitAmount: 75000 },
      { description: 'Content Creation Package', quantity: 1, unitAmount: 35000 },
    ],
  },
  {
    supplierName: 'Swift Logistics',
    lineItems: [
      { description: 'Express Shipping Services', quantity: 25, unitAmount: 2499 },
    ],
  },
  {
    supplierName: 'Bright Ideas Design',
    lineItems: [
      { description: 'Brand Refresh Package', quantity: 1, unitAmount: 125000 },
      { description: 'Business Card Design', quantity: 1, unitAmount: 15000 },
    ],
  },
  {
    supplierName: 'DataVault Storage',
    lineItems: [
      { description: 'Cloud Backup - 1TB', quantity: 1, unitAmount: 19900 },
      { description: 'Data Recovery Service', quantity: 1, unitAmount: 45000 },
    ],
  },
  {
    supplierName: 'Premier Office Furniture',
    lineItems: [
      { description: 'Ergonomic Desk Chairs', quantity: 4, unitAmount: 34999 },
      { description: 'Standing Desks', quantity: 2, unitAmount: 59999 },
    ],
  },
  {
    supplierName: 'Nexus Telecom',
    lineItems: [
      { description: 'Business Phone System', quantity: 1, unitAmount: 89900 },
      { description: 'Monthly Service Plan', quantity: 1, unitAmount: 24900 },
    ],
  },
  {
    supplierName: 'Apex Legal Services',
    lineItems: [
      { description: 'Contract Review', quantity: 3, unitAmount: 35000 },
      { description: 'Legal Consultation', quantity: 2, unitAmount: 50000 },
    ],
  },
  {
    supplierName: 'Summit Insurance Group',
    lineItems: [
      { description: 'Business Liability Insurance - Quarterly', quantity: 1, unitAmount: 185000 },
    ],
  },
  {
    supplierName: 'ProTech Maintenance',
    lineItems: [
      { description: 'HVAC System Service', quantity: 1, unitAmount: 42500 },
      { description: 'Fire Extinguisher Inspection', quantity: 1, unitAmount: 8500 },
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

  // Use first 3 suppliers for default bills
  return SUPPLIER_BILLS.slice(0, 3).map((template) => ({
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

export const generateRandomBills = (currency: string, count: number = 3): FakeBill[] => {
  const now = Math.floor(Date.now() / 1000);

  // Shuffle and pick random suppliers
  const shuffled = [...SUPPLIER_BILLS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, SUPPLIER_BILLS.length));

  return selected.map((template) => {
    // Random due date between 7 and 45 days from now
    const daysUntilDue = 7 + Math.floor(Math.random() * 38);
    const dueDate = now + daysUntilDue * 24 * 60 * 60;

    return {
      id: generateBillId(),
      supplierName: template.supplierName,
      invoiceNumber: generateInvoiceNumber(),
      amount: calculateBillTotal(template.lineItems),
      currency,
      status: 'open' as const,
      dueDate,
      lineItems: template.lineItems,
      createdAt: now,
    };
  });
};

export const getBillsStorageKey = (demoName: string, accountId: string): string => {
  return `${demoName}-bills-${accountId}`;
};
