'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getFinancialAccounts as getFinancialAccountsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccounts';
import { createFinancialAccount as createFinancialAccountAction } from '@/app/api/money-management/financial-accounts/createFinancialAccount';
import { getFinancialAccountTransactions as getFinancialAccountTransactionsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccountTransactions';
import { getFinancialAddresses as getFinancialAddressesAction } from '@/app/api/money-management/financial-addresses/getFinancialAddresses';
import { createFinancialAddress as createFinancialAddressAction } from '@/app/api/money-management/financial-addresses/createFinancialAddress';
import { fundFinancialAccount as fundFinancialAccountAction } from '@/app/api/money-management/financial-accounts/fundFinancialAccount';
import { formatPrice } from '@/utils/formatPrice';
import { Skeleton } from '@/components/common/Skeleton';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import type { Stripe } from 'stripe';

// ─── Inline SVG icons matching the reference ─────────────────────────────────

type SvgProps = React.SVGProps<SVGSVGElement>;

const IVault = (p: SvgProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="8" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="16" y2="12"/>
  </svg>
);
const IShield = (p: SvgProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const ISparkle = (p: SvgProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z"/>
  </svg>
);
const IMsg = (p: SvgProps) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ISend = (p: SvgProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const ICheck = (p: SvgProps) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IBank = (p: SvgProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="3 21 21 21"/><polyline points="3 10 21 10"/>
    <line x1="5" y1="6" x2="12" y2="3"/><line x1="12" y1="3" x2="19" y2="6"/>
    <line x1="6" y1="14" x2="6" y2="17"/><line x1="10" y1="14" x2="10" y2="17"/>
    <line x1="14" y1="14" x2="14" y2="17"/><line x1="18" y1="14" x2="18" y2="17"/>
  </svg>
);
const ITx = (p: SvgProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M7 17l-4-4 4-4"/><path d="M3 13h14"/>
    <path d="M17 7l4 4-4 4"/><path d="M21 11H7"/>
  </svg>
);
const IArrowUp = (p: SvgProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IArrowR = (p: SvgProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const ICard = (p: SvgProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const IPlus = (p: SvgProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IBeaker = (p: SvgProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/>
    <path d="M6 14h12"/>
  </svg>
);

// ─── Mock data (matching reference HTML exactly) ───────────────────────────────

const SUGGESTIONS = [
  'Move £800 into my VAT savings pot',
  'How much have I earned in interest this quarter?',
  'Withdraw £2,000 to my main account on Friday',
  'Set up a new pot for staff bonuses',
];

const SCHEDULED = [
  { d: '05', m: 'Jul', t: 'Withdraw to Barclays ••3421', s: 'Recurring — first Mondays', amt: '£2,500.00' },
  { d: '07', m: 'Jul', t: 'Auto-allocation: VAT Savings', s: '18% of daily settlement', amt: '~£148' },
  { d: '09', m: 'Jul', t: 'Operating Reserve top-up', s: 'Manual schedule', amt: '£500.00' },
];

type Pot = {
  name: string;
  purpose: string;
  amount: number;
  aer: number;
  tone: 'green' | 'navy';
  progress: number;
  progressLabel: string;
  interest: number;
};

const INITIAL_POTS: Pot[] = [
  { name: 'VAT Savings', purpose: 'Quarterly VAT (next due 7 Aug)', amount: 2100.00, aer: 3.5, tone: 'green', progress: 64, progressLabel: '£2,100 / £3,300 target', interest: 6.18 },
  { name: 'Operating Reserve', purpose: '3 months of fixed costs', amount: 1500.00, aer: 2.8, tone: 'navy', progress: 50, progressLabel: '£1,500 / £3,000 target', interest: 3.50 },
];

type PendingAction = { amount: number; target: string; aer: number } | null;
type ConvoMsg = { kind: 'user' | 'system'; text: string };

// ─── Page ─────────────────────────────────────────────────────────────────────

const WalletPage = () => {
  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();
  const queryClient = useQueryClient();
  const router = useRouter();


  // ── AI assistant state (matching reference initial state) ──────────────────
  const [aiInput, setAiInput] = useState('');
  const [convo, setConvo] = useState<ConvoMsg[]>([
    { kind: 'user', text: 'Move £800 into my VAT savings pot' },
  ]);
  const [pending, setPending] = useState<PendingAction>({ amount: 800, target: 'VAT Savings pot', aer: 3.5 });

  // ── Pots state (interactive mock) ─────────────────────────────────────────
  const [pots, setPots] = useState<Pot[]>(INITIAL_POTS);
  const [localAvailable, setLocalAvailable] = useState<number>(4237.18);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);

  // ── Transaction filter ─────────────────────────────────────────────────────
  const [txTab, setTxTab] = useState<'all' | 'in' | 'out' | 'pots'>('all');

  // ── Top-up state ───────────────────────────────────────────────────────────
  const [isTopUpPending, setIsTopUpPending] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: financialAccounts, isPending: isAccountsPending } = useQuery({
    queryKey: ['financial-accounts', account?.id, stripeSecretKey],
    queryFn: () => getFinancialAccountsAction({ accountId: account!.id, stripeSecretKey }),
    enabled: !!account,
  });

  // Auto-create "ClearAccept Wallet" FA if none exist yet
  const autoCreatingRef = useRef(false);
  useEffect(() => {
    if (!account || isAccountsPending || autoCreatingRef.current || (financialAccounts && financialAccounts.length > 0)) return;
    autoCreatingRef.current = true;
    createFinancialAccountAction({ name: 'ClearAccept Wallet', accountId: account.id, stripeSecretKey })
      .then(() => queryClient.invalidateQueries({ queryKey: ['financial-accounts', account.id, stripeSecretKey] }))
      .catch((err) => console.error('Failed to auto-create wallet FA:', err))
      .finally(() => { autoCreatingRef.current = false; });
  }, [account, isAccountsPending, financialAccounts]);

  const currentFA = useMemo(() => {
    if (!financialAccounts || financialAccounts.length === 0) return null;
    return [...financialAccounts].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())[0];
  }, [financialAccounts]);

  const firstFaId = currentFA?.id ?? null;

  // Fetch transactions for every FA in parallel
  const faIds = useMemo(() => financialAccounts?.map(fa => fa.id) ?? [], [financialAccounts]);

  // Fan out to all FAs in a single query — hooks can't be called in a loop.
  const { data: allFaTransactions, isPending: isTransactionsPending } = useQuery({
    queryKey: ['financial-account-transactions-all', faIds],
    queryFn: async () => {
      const results = await Promise.all(
        faIds.map(faId => getFinancialAccountTransactionsAction({
          financialAccountId: faId, stripeSecretKey, accountId: account!.id,
        }))
      );
      return results.flat();
    },
    enabled: !!account && faIds.length > 0,
  });

  const transactions = useMemo(() => {
    if (!allFaTransactions) return undefined;
    return [...allFaTransactions].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
  }, [allFaTransactions]);

  const { data: financialAddresses } = useQuery({
    queryKey: ['financial-addresses', currentFA?.id, stripeSecretKey],
    queryFn: () => getFinancialAddressesAction({
      financialAccountId: currentFA!.id, stripeSecretKey, accountId: account!.id,
    }),
    enabled: !!currentFA,
  });

  // ─── Derived data ─────────────────────────────────────────────────────────

  const fmt = (value: number | undefined, currency: string | undefined) => {
    if (value === undefined || !currency) return '—';
    return formatPrice(value, language as SupportedLanguage, currency as CurrencyCode);
  };

  // Sum available balances across all FAs (same currency)
  const primaryBalance = useMemo(() => {
    if (!financialAccounts || financialAccounts.length === 0) return null;
    let total = 0;
    let currency = 'gbp';
    for (const fa of financialAccounts) {
      if (!fa.balance?.available) continue;
      const entries = Object.entries(fa.balance.available);
      if (entries.length > 0) {
        total += (entries[0][1] as { value: number; currency: string }).value;
        currency = (entries[0][1] as { value: number; currency: string }).currency;
      }
    }
    return { value: total, currency };
  }, [financialAccounts]);

  // Sync localAvailable from real FA balance total
  useEffect(() => {
    if (primaryBalance?.value != null) setLocalAvailable(primaryBalance.value / 100);
  }, [primaryBalance?.value]);

  const lastSettlement = useMemo(
    () => transactions?.find((tx) => (tx.balance_impact?.available?.value ?? 0) > 0) ?? null,
    [transactions],
  );

  const thisMonthSummary = useMemo(() => {
    if (!transactions) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let settlementsIn = 0, withdrawals = 0;
    const currency = primaryBalance?.currency ?? 'gbp';
    for (const tx of transactions) {
      if (new Date(tx.created) < monthStart) continue;
      const impact = tx.balance_impact?.available?.value ?? 0;
      if (impact > 0) settlementsIn += impact;
      else if (impact < 0) withdrawals += Math.abs(impact);
    }
    return { settlementsIn, withdrawals, currency };
  }, [transactions, primaryBalance]);

  const filteredTx = useMemo(() => {
    if (!transactions) return [];
    if (txTab === 'in') return transactions.filter(tx => (tx.balance_impact?.available?.value ?? 0) > 0).slice(0, 10);
    if (txTab === 'out') return transactions.filter(tx => (tx.balance_impact?.available?.value ?? 0) < 0).slice(0, 10);
    return transactions.slice(0, 10);
  }, [transactions, txTab]);

  const hasFinancialAddress = financialAddresses && financialAddresses.length > 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleRequestAddress = () => {
    if (!account || !currentFA) return;
    const walletCurrency: string = ((currentFA as any).storage?.holds_currencies as string[] | undefined)?.[0] ?? 'gbp';
    createFinancialAddressAction({
      accountId: account.id, financialAccountId: currentFA.id,
      currency: walletCurrency, stripeSecretKey,
    }).then(() => queryClient.invalidateQueries({ queryKey: ['financial-addresses', currentFA.id] }));
  };

  const handleTopUp = async (amount: number) => {
    if (!account || !currentFA || !financialAddresses?.[0]) return;
    setIsTopUpPending(true);
    try {
      await fundFinancialAccountAction({
        accountId: account.id, financialAccountId: currentFA.id,
        financialAddressId: (financialAddresses[0] as { id: string }).id,
        amount, currency: primaryBalance?.currency ?? 'gbp', stripeSecretKey,
      });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts', account.id, stripeSecretKey] });
      queryClient.invalidateQueries({ queryKey: ['financial-account-transactions', currentFA.id] });
    } finally { setIsTopUpPending(false); }
  };

  const formatTxDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language || 'en', { month: 'short', day: 'numeric' });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      inbound_transfer: 'Inbound Transfer', outbound_payment: 'Outbound Payment',
      outbound_transfer: 'Outbound Transfer', received_credit: 'Settlement',
      received_debit: 'Received Debit', stripe_fee: 'Stripe Fee',
    };
    return labels[category] || category;
  };

  // ─── AI handlers ──────────────────────────────────────────────────────────

  const onAsk = (q: string) => {
    const text = q.trim();
    if (!text) return;
    setAiInput('');
    setConvo(prev => [...prev, { kind: 'user', text }]);
    const lc = text.toLowerCase();
    const amtMatch = text.match(/£?\s*([\d,]+(?:\.\d+)?)/);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 800;
    let target = 'VAT Savings pot', aer = 3.5;
    if (lc.includes('operating') || lc.includes('reserve')) { target = 'Operating Reserve'; aer = 2.8; }
    setPending({ amount, target, aer });
  };

  const confirmTransfer = () => {
    if (!pending) return;
    setLocalAvailable(prev => prev - pending.amount);
    setPots(prev => prev.map(p => {
      if (pending.target.toLowerCase().includes(p.name.toLowerCase())) {
        return { ...p, amount: p.amount + pending.amount };
      }
      return p;
    }));
    setConvo(prev => [...prev, { kind: 'system', text: `Confirmed: £${pending.amount} moved to ${pending.target}.` }]);
    const toastText = `£${pending.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} moved to ${pending.target}`;
    setToast(toastText);
    setPending(null);
    setTimeout(() => setToast(null), 2800);
  };

  const cancelTransfer = () => {
    setPending(null);
    setConvo(prev => [...prev, { kind: 'system', text: 'Cancelled' }]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 20, alignItems: 'start' }}>

      {/* ── Left column ────────────────────────────────────────────────────── */}
      <div>

        {/* Balance card */}
        <div style={{
          background: '#fff', borderTop: '4px solid #77B32A', borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '26px 28px',
          marginBottom: 18, display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' as const,
        }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#8892A0', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Available balance
            </div>
            {isAccountsPending ? (
              <>
                <Skeleton className='h-10 w-48 mb-2' />
                <Skeleton className='h-4 w-64' />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/${language}/dashboard/financial-accounts`)}
                  style={{ fontSize: 36, fontWeight: 700, color: '#323E48', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' as const, display: 'block' }}
                  title="View all accounts"
                >
                  {primaryBalance
                    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: primaryBalance.currency.toUpperCase(), minimumFractionDigits: 2 }).format(primaryBalance.value / 100)
                    : '£0.00'
                  }
                </button>
                <div style={{ fontSize: 13, color: '#4D5761', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#5a881f', display: 'inline-flex' }}>
                    <IArrowUp style={{ transform: 'rotate(180deg)' }} />
                  </span>
                  {lastSettlement ? (
                    <>
                      Last settlement{' '}
                      <b style={{ color: '#323E48', fontWeight: 600 }}>
                        {fmt(lastSettlement.amount?.value, lastSettlement.amount?.currency)}
                      </b>
                      {' · '}
                      {formatTxDate(lastSettlement.created)}{' '}
                      {new Date(lastSettlement.created).toLocaleTimeString(language || 'en', { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : (
                    <span>No settlements yet — fund this account to get started</span>
                  )}
                </div>
                {!hasFinancialAddress && currentFA && (
                  <button
                    onClick={handleRequestAddress}
                    style={{ marginTop: 10, fontSize: 13, color: '#5a881f', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                  >
                    + Request sort code &amp; account number
                  </button>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => router.push(`/${language}/dashboard/financial-accounts`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#77B32A', color: '#fff', border: 'none' }}
            >
              See details <IArrowR />
            </button>
          </div>
        </div>

        {/* Corporate card banner */}
        <div style={{
          background: '#323E48', color: '#fff', borderRadius: 8,
          padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24,
          overflow: 'hidden', position: 'relative', flexWrap: 'wrap' as const, marginBottom: 22,
        }}>
          {/* Mini card */}
          <div style={{
            width: 140, height: 88, borderRadius: 8,
            background: 'linear-gradient(135deg, #242D34 0%, #323E48 100%)',
            border: '1px solid #4D5761', padding: '12px 14px', flexShrink: 0,
            display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
            position: 'relative', boxShadow: '0 6px 16px rgba(0,0,0,.25)',
          }}>
            <div style={{ position: 'absolute', top: 32, left: 12, width: 22, height: 16, borderRadius: 3, background: 'linear-gradient(135deg, #c8a64b, #f5d678)' }} />
            <span style={{ fontSize: 11, color: '#8892A0', letterSpacing: '.12em', fontVariantNumeric: 'tabular-nums' }}>•••• 4421</span>
            <div style={{ alignSelf: 'flex-end', width: 18, height: 18, borderRadius: 999, background: '#77B32A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ICheck />
            </div>
          </div>
          {/* Copy */}
          <div style={{ flex: '1 1 280px', minWidth: 0, position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#77B32A', marginBottom: 6 }}>Corporate Card</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', margin: '0 0 6px' }}>Spend directly from your wallet</h3>
            <p style={{ color: '#cfd4da', fontSize: 13, maxWidth: 540, margin: 0 }}>The ClearAccept Corporate Card draws funds straight from your available balance and pots — no top-ups, no waiting for settlements.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexShrink: 0, position: 'relative' }}>
            <button
              onClick={() => firstFaId && router.push(`/${language}/dashboard/financial-accounts/${firstFaId}?tab=cards`)}
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', padding: '10px 18px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              View cards
            </button>
            <button
              onClick={() => firstFaId && router.push(`/${language}/dashboard/financial-accounts/${firstFaId}?tab=cards`)}
              style={{ background: '#77B32A', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ICard /> Issue a card
            </button>
          </div>
        </div>

        {/* Capital promotion banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f3f8e9 0%, #eaf3d6 100%)',
          border: '1px solid #c9dca0', borderLeft: '4px solid #77B32A',
          borderRadius: 8, padding: '18px 24px', marginBottom: 22,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#5a881f', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
              Capital offer available
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#323E48', marginBottom: 4 }}>
              Your liquidity for the next 3 months is low
            </div>
            <div style={{ fontSize: 13, color: '#4D5761', lineHeight: 1.5 }}>
              Based on your transaction history, you qualify for a pre-approved capital offer. Get up to <strong>£15,400</strong> to keep your business moving.
            </div>
          </div>
          <button
            onClick={() => router.push(`/${language}/dashboard/capital`)}
            style={{ flexShrink: 0, background: '#77B32A', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
          >
            View offer →
          </button>
        </div>



        {/* Recent activity */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '22px 24px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#323E48', margin: 0, letterSpacing: '-0.01em' }}>Recent activity</h3>
              <div style={{ fontSize: 12, color: '#8892A0', marginTop: 2 }}>Last 10 transactions across all accounts</div>
            </div>
            <div style={{ display: 'inline-flex', background: '#F4F4F4', borderRadius: 6, padding: 2 }}>
              {(['all', 'in', 'out', 'pots'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTxTab(tab)}
                  style={{ border: 'none', padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: 'pointer', background: txTab === tab ? '#fff' : 'transparent', color: txTab === tab ? '#323E48' : '#4D5761', boxShadow: txTab === tab ? '0 1px 2px rgba(0,0,0,.08)' : 'none' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isTransactionsPending ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} className='h-10 w-full' />)}
            </div>
          ) : txTab === 'pots' ? (
            <div style={{ padding: '32px 0', textAlign: 'center' as const, color: '#8892A0', fontSize: 13 }}>No pot movements yet</div>
          ) : filteredTx.length > 0 ? (
            filteredTx.map((tx) => {
              const impact = tx.balance_impact?.available?.value ?? 0;
              const isCredit = impact >= 0;
              const isMove = tx.category === 'outbound_transfer' || tx.category === 'inbound_transfer';
              return (
                <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto auto', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F4F4F4' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: isMove ? '#fdeed1' : isCredit ? '#f3f8e9' : '#eaf0f6', color: isMove ? '#8b5e0b' : isCredit ? '#5a881f' : '#3f5673', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isMove ? <ITx /> : isCredit ? <IArrowUp style={{ transform: 'rotate(180deg)' }} /> : <IBank />}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, color: '#323E48', fontWeight: 600 }}>{getCategoryLabel(tx.category)}</div>
                    <div style={{ fontSize: 11, color: '#8892A0', marginTop: 2 }}>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isCredit ? '#5a881f' : '#323E48', fontVariantNumeric: 'tabular-nums' }}>
                    {isCredit ? '+' : ''}{fmt(impact, tx.balance_impact?.available?.currency ?? tx.amount?.currency)}
                  </div>
                  <div style={{ fontSize: 11, color: '#8892A0', textAlign: 'right' as const, minWidth: 90, fontVariantNumeric: 'tabular-nums' }}>
                    {formatTxDate(tx.created)}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center' as const, color: '#8892A0', fontSize: 13 }}>No transactions yet</div>
          )}
        </div>
      </div>

      {/* ── Right rail ───────────────────────────────────────────────────────── */}
      <aside>
        {/* This month */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '20px 22px', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#323E48', letterSpacing: '-0.01em' }}>This month</h4>
          {!thisMonthSummary || isTransactionsPending ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className='h-8 w-full' />)}
            </div>
          ) : (
            <>
              {[
                { l: 'Settlements in', v: fmt(thisMonthSummary.settlementsIn, thisMonthSummary.currency), vc: '#323E48' },
                { l: 'Withdrawals', v: fmt(thisMonthSummary.withdrawals, thisMonthSummary.currency), vc: '#323E48' },
                { l: 'Allocated to pots', v: '£3,200.00', vc: '#323E48' },
                { l: 'Interest earned', v: '+£9.68', vc: '#5a881f' },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 13, borderBottom: '1px solid #F4F4F4' }}>
                  <span style={{ color: '#4D5761' }}>{row.l}</span>
                  <span style={{ color: row.vc, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.v}</span>
                </div>
              ))}
            </>
          )}
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'transparent', color: '#4D5761', border: '1px solid #D8DCE0', borderRadius: 4, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
            View statement <IArrowR />
          </button>
        </div>

        {/* Scheduled */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '20px 22px', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#323E48', letterSpacing: '-0.01em' }}>Scheduled</h4>
          {SCHEDULED.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < SCHEDULED.length - 1 ? '1px solid #F4F4F4' : 'none', fontSize: 13 }}>
              <div style={{ width: 44, flexShrink: 0, background: '#F4F4F4', borderRadius: 4, textAlign: 'center' as const, padding: '6px 0' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#323E48', lineHeight: 1 }}>{s.d}</div>
                <div style={{ fontSize: 10, color: '#8892A0', letterSpacing: '.04em', textTransform: 'uppercase' as const, marginTop: 2 }}>{s.m}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#323E48', fontWeight: 600 }}>{s.t}</div>
                <div style={{ color: '#8892A0', fontSize: 11, marginTop: 2 }}>{s.s}</div>
              </div>
              <span style={{ fontWeight: 700, color: '#323E48', fontVariantNumeric: 'tabular-nums' }}>{s.amt}</span>
            </div>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'transparent', color: '#4D5761', border: '1px solid #D8DCE0', borderRadius: 4, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
            Manage schedules
          </button>
        </div>

        {/* Auto-allocation rules */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '20px 22px', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#323E48', letterSpacing: '-0.01em' }}>Auto-allocation rules</h4>
          <div style={{ fontSize: 13, color: '#4D5761', lineHeight: 1.55, marginBottom: 12 }}>Each settlement is split automatically:</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {[
              { label: 'VAT Savings', pct: '18%', dot: '#77B32A' },
              { label: 'Operating Reserve', pct: '10%', dot: '#323E48' },
              { label: 'Available balance', pct: '72%', dot: '#D8DCE0' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#323E48' }}>
                  <span style={{ width: 8, height: 8, background: row.dot, borderRadius: 999, display: 'inline-block' }} />
                  {row.label}
                </span>
                <b style={{ fontVariantNumeric: 'tabular-nums', color: '#323E48' }}>{row.pct}</b>
              </div>
            ))}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'transparent', color: '#4D5761', border: '1px solid #D8DCE0', borderRadius: 4, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
            Edit rules
          </button>
        </div>

        {/* Simulate settlement (dev tool) */}
        {hasFinancialAddress && (
          <div style={{ borderRadius: 6, border: '1px dashed #D8DCE0', background: '#FAFBFC', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <IBeaker style={{ color: '#8892A0' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8892A0' }}>Simulate settlement</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {[500_00, 1000_00, 2500_00, 5000_00].map(amount => (
                <button
                  key={amount}
                  disabled={isTopUpPending}
                  onClick={() => handleTopUp(amount)}
                  style={{ padding: '7px 12px', borderRadius: 4, border: '1px solid #D8DCE0', background: '#fff', fontSize: 12, fontWeight: 500, color: '#4D5761', cursor: 'pointer', opacity: isTopUpPending ? 0.5 : 1 }}
                >
                  {fmt(amount, primaryBalance?.currency ?? 'gbp')}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Toast ──────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#323E48', color: '#fff', padding: '12px 18px', borderRadius: 6, boxShadow: '0 8px 20px rgba(50,62,72,.20)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, zIndex: 50 }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: '#77B32A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ICheck />
          </span>
          {toast}
        </div>
      )}

    </div>
  );
};

export default WalletPage;
