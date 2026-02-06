'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import type Stripe from 'stripe';

export type Bill = {
  invoice: Stripe.Invoice;
  supplierAccountId: string;
  supplierName: string;
};

type GetBillsParams = {
  accountId: string;
  stripeSecretKey?: string;
};

export const getBills = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetBillsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get bills because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    // List other connected accounts (v2 accounts with merchant config)
    const { data: allAccounts } = await stripe.v2.core.accounts.list({
      applied_configurations: ['merchant'],
    });

    // Filter out the current merchant
    const otherAccounts = allAccounts.filter((a) => a.id !== accountId);

    if (otherAccounts.length === 0) {
      return [];
    }

    // Query each supplier CA for invoices in parallel
    const billsPerAccount = await Promise.all(
      otherAccounts.map(async (supplierAccount) => {
        try {
          const { data: invoices } = await stripe.invoices.list(
            {
              limit: 100,
            },
            { stripeAccount: supplierAccount.id },
          );

          // Filter for invoices that are supplier bills addressed to this merchant
          // Exclude drafts — only show finalized invoices (open/paid/void/uncollectible)
          const matchingInvoices = invoices.filter(
            (invoice) =>
              invoice.metadata?.type === 'supplier-bill' &&
              invoice.metadata?.billToAccountId === accountId &&
              invoice.status !== 'draft',
          );

          return matchingInvoices.map((invoice) => ({
            invoice: plain(invoice),
            supplierAccountId: supplierAccount.id,
            supplierName:
              invoice.metadata?.supplierName ??
              supplierAccount.display_name ??
              supplierAccount.id,
          }));
        } catch (error) {
          console.error(
            `Error fetching invoices from supplier ${supplierAccount.id}:`,
            error,
          );
          return [];
        }
      }),
    );

    // Flatten and return all bills
    return plain(billsPerAccount.flat());
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
};

