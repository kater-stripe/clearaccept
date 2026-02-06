'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type SeedBillsParams = {
  accountId: string;
  stripeSecretKey?: string;
};

const SUPPLIER_BILLS = [
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

export const seedBills = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: SeedBillsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to seed bills because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    // Get the current merchant's account info for the customer record
    const currentAccount = await stripe.v2.core.accounts.retrieve(accountId);
    const merchantEmail = currentAccount.contact_email ?? 'merchant@example.com';
    const merchantCurrency = currentAccount.defaults?.currency ?? 'usd';

    // List other connected accounts (v2 accounts with merchant config)
    const { data: allAccounts } = await stripe.v2.core.accounts.list({
      applied_configurations: ['merchant'],
    });

    // Filter out the current merchant
    const otherAccounts = allAccounts.filter((a) => a.id !== accountId);

    if (otherAccounts.length === 0) {
      return {
        message:
          'No other connected accounts found to use as suppliers. Create at least one other merchant account first.',
      };
    }

    const createdInvoices = [];

    // Retrieve full identity details for each supplier account
    const supplierDetails = await Promise.all(
      otherAccounts.map(async (a) => {
        try {
          const full = await stripe.v2.core.accounts.retrieve(a.id, {
            include: ['identity'],
          });
          return full;
        } catch {
          return a;
        }
      }),
    );

    // Always create 3 bills, cycling through available supplier accounts
    for (let i = 0; i < 3; i++) {
      const supplierAccount = supplierDetails[i % supplierDetails.length];
      const billTemplate = SUPPLIER_BILLS[i];

      // Derive supplier name: business name > individual name > display name > fallback
      const identity = supplierAccount.identity as Record<string, any> | undefined;
      const businessName = identity?.business_details?.registered_name;
      const individualGiven = identity?.individual?.given_name;
      const individualSurname = identity?.individual?.surname;
      const individualName =
        individualGiven && individualSurname
          ? `${individualGiven} ${individualSurname}`
          : individualGiven || individualSurname || null;
      const supplierName =
        businessName || individualName || supplierAccount.display_name || billTemplate.supplierName;

      // Create a customer in the supplier's CA representing the current merchant
      const customer = await stripe.customers.create(
        {
          name: currentAccount.display_name ?? merchantEmail,
          email: merchantEmail,
          metadata: {
            billToAccountId: accountId,
          },
        },
        { stripeAccount: supplierAccount.id },
      );

      // Create the invoice in the supplier's CA
      const invoice = await stripe.invoices.create(
        {
          customer: customer.id,
          currency: merchantCurrency,
          days_until_due: 30,
          collection_method: 'send_invoice',
          metadata: {
            type: 'supplier-bill',
            billToAccountId: accountId,
            supplierName,
          },
        },
        { stripeAccount: supplierAccount.id },
      );

      // Add line items
      for (const item of billTemplate.lineItems) {
        await stripe.invoiceItems.create(
          {
            customer: customer.id,
            invoice: invoice.id,
            description: item.description,
            unit_amount_decimal: String(item.unitAmount),
            quantity: item.quantity,
            currency: merchantCurrency,
          },
          { stripeAccount: supplierAccount.id },
        );
      }

      // Finalize the invoice so it gets a hosted_invoice_url
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(
        invoice.id,
        undefined,
        { stripeAccount: supplierAccount.id },
      );

      createdInvoices.push(plain(finalizedInvoice));
    }

    return { invoices: createdInvoices };
  } catch (error: unknown) {
    console.error('Error seeding bills:', error);

    return {
      message:
        'An error occurred when calling the Stripe API to seed bills. ' +
        (error instanceof Error ? error.message : String(error)),
    };
  }
};

