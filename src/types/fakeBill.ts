export type FakeBillLineItem = {
  description: string;
  quantity: number;
  unitAmount: number;
};

export type FakeBill = {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number; // in cents
  currency: string;
  status: 'open' | 'paid';
  dueDate: number; // unix timestamp
  lineItems: FakeBillLineItem[];
  createdAt: number; // unix timestamp
};
