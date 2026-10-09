import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import PinModal from '../components/PinModal';

// ── Types ───────────────────────────────────────────────────────────

interface WalletData {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface TransactionData {
  id: number;
  senderWalletId: number | null;
  receiverWalletId: number | null;
  amount: number;
  transactionType: string;
  status: string;
  referenceNumber: string;
  createdAt: string;
}

// ── Formatters ──────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard interactive states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch wallet
    api
      .get(`/wallets/user/${user.id}`)
      .then(({ data }) => setWallet(data))
      .catch(() => setError('Failed to load wallet data.'))
      .finally(() => setWalletLoading(false));

    // Fetch transactions
    api
      .get(`/transactions/user/${user.id}`)
      .then(({ data }) => setTransactions(data))
      .catch(() => {})
      .finally(() => setTxnLoading(false));
  }, [user]);

  // Derived financial metrics
  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    if (!wallet) return { totalInflow: 0, totalOutflow: 0 };

    transactions.forEach((tx) => {
      if (tx.status === 'SUCCESS') {
        if (tx.receiverWalletId === wallet.id) {
          inflow += Number(tx.amount);
        } else if (tx.senderWalletId === wallet.id) {
          outflow += Number(tx.amount);
        }
      }
    });

    return { totalInflow: inflow, totalOutflow: outflow };
  }, [transactions, wallet]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const isSender = wallet && tx.senderWalletId === wallet.id;
      if (activeTab === 'INFLOW' && isSender) return false;
      if (activeTab === 'OUTFLOW' && !isSender) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = tx.referenceNumber.toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);
        const matchesType = tx.transactionType.toLowerCase().includes(q);
        return matchesRef || matchesAmount || matchesType;
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery, wallet]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `${label} copied to clipboard.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* ── Error Banner ────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-300 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Security Alert: Missing PIN Warning ────────────────────── */}
      {!user?.hasPinSet && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                Action Required: Configure 4-Digit Security PIN
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                To protect your wallet, outgoing fund transfers require a verified PIN code.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPinModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Set Up PIN Now</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {/* ── Blocked Wallet Banner ─────────────────────────────────── */}
      {wallet?.status === 'BLOCKED' && (
        <div className="bg-gradient-to-r from-rose-500/20 to-red-600/10 border border-rose-500/40 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-lg shadow-rose-950/20">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200">Wallet Account Restricted</h4>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Your wallet is currently marked as BLOCKED. Outgoing transfers are paused. Please contact bank administration.
            </p>
          </div>
        </div>
      )}

      {/* ── Hero Grid: Virtual Debit Card + Main Balance ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Luxury Textured Virtual Titanium Debit Card */}
        <div className="lg:col-span-5 relative group">
          <div className="w-full h-64 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/60 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]">
            {/* Subtle Metallic / Mesh Watermark Texture */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            <div className="absolute -right-16 -top-16 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Card Top Row */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-white/90">
                  PAYWALLET PLATINUM
                </span>
              </div>
              {/* Contactless waves symbol */}
              <div className="text-white/60">
                <svg className="w-6 h-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
            </div>

            {/* EMV Gold Chip & Status */}
            <div className="flex items-center gap-4 relative z-10 my-1">
              <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border border-amber-300 shadow-inner flex items-center justify-center">
                <div className="w-7 h-5 border border-amber-700/40 rounded-sm grid grid-cols-2"></div>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                {cardFrozen ? '🔒 CARD LOCKED' : '⚡ NFC ENABLED'}
              </span>
            </div>

            {/* Card Digits */}
            <div className="relative z-10">
              <div className="font-mono text-xl sm:text-2xl tracking-[0.25em] text-white font-bold drop-shadow-md">
                4532 •••• •••• {wallet?.id ? String(wallet.id).padStart(4, '0') : '1024'}
              </div>
            </div>

            {/* Card Bottom Row: Holder + Expiry + CVV */}
            <div className="flex items-center justify-between text-xs relative z-10 pt-1">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">CARDHOLDER</span>
                <span className="font-semibold text-slate-200 uppercase truncate max-w-[150px] block">
                  {user?.email?.split('@')[0] || 'DEMO USER'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">EXPIRES</span>
                  <span className="font-mono text-slate-200 font-semibold">12/29</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">CVV</span>
                  <button
                    onClick={() => setShowCvv(!showCvv)}
                    className="font-mono text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {showCvv ? '892' : '•••'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card Management Action Pills */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                setCardFrozen(!cardFrozen);
                addToast(cardFrozen ? 'success' : 'error', cardFrozen ? 'Card has been unlocked.' : 'Card temporarily frozen.');
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{cardFrozen ? '🔓 Unfreeze Card' : '❄️ Freeze Card'}</span>
            </button>
            <button
              onClick={() => copyToClipboard(`453200000000${String(wallet?.id || 1).padStart(4, '0')}`, 'Card number')}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* Right: Balance Overview & Executive Quick Actions */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Liquid Balance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  INR
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                  wallet?.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                ● {wallet?.status || 'LOADING'}
              </span>
            </div>

            {/* Primary Balance display */}
            <div className="my-2">
              {walletLoading ? (
                <div className="h-12 w-48 bg-slate-800 animate-pulse rounded-2xl"></div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                    {formatCurrency(wallet?.balance || 0, wallet?.currency || 'INR')}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Available instantly for transfers, payment gateway deposits, and billing.
            </p>
          </div>

          {/* Account Identifiers */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">Wallet Account ID</span>
              <button
                onClick={() => copyToClipboard(String(wallet?.id || 1), 'Wallet ID')}
                className="text-xs font-bold text-slate-200 font-mono hover:text-blue-400 transition-colors flex items-center gap-1 mt-0.5"
              >
                <span>#{wallet?.id || '—'}</span>
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">Security PIN</span>
              <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                {user?.hasPinSet ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Unset
                  </span>
                )}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-bold uppercase text-slate-500">Currency</span>
              <span className="text-xs font-bold text-blue-400 mt-0.5 block">Indian Rupee (INR)</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/add-funds"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Funds (Razorpay)</span>
            </Link>
            <Link
              to="/transfer"
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 px-5 rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>Send Money</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Financial Flow Metrics & Cash Flow ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Inflow Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Inflow (Deposits)
            </span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">
              +{formatCurrency(totalInflow, wallet?.currency || 'INR')}
            </span>
          </div>
        </div>

        {/* Total Outflow Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Outflow (Transfers)
            </span>
            <span className="text-xl font-bold text-rose-400 tabular-nums">
              −{formatCurrency(totalOutflow, wallet?.currency || 'INR')}
            </span>
          </div>
        </div>

        {/* Cash Flow Health Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cash Flow Ratio
            </span>
            <span className="text-xs font-bold text-blue-400">Healthy</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${totalInflow + totalOutflow > 0 ? (totalInflow / (totalInflow + totalOutflow)) * 100 : 100}%`,
              }}
            ></div>
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{
                width: `${totalInflow + totalOutflow > 0 ? (totalOutflow / (totalInflow + totalOutflow)) * 100 : 0}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-2">
            <span>Inflow: {totalInflow + totalOutflow > 0 ? Math.round((totalInflow / (totalInflow + totalOutflow)) * 100) : 100}%</span>
            <span>Outflow: {totalInflow + totalOutflow > 0 ? Math.round((totalOutflow / (totalInflow + totalOutflow)) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* ── Quick Send Row (Recent Contacts Preset) ───────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Quick Transfer Shortcuts
            </h3>
            <p className="text-xs text-slate-400">
              One-click recipient selection for rapid P2P payments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {/* Preset 1 */}
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
              #2
            </div>
            <div className="text-left pr-2">
              <span className="text-xs font-semibold text-slate-200 block">User Account #2</span>
              <span className="text-[10px] text-slate-500 block">Send INR</span>
            </div>
          </button>

          {/* Preset 2 */}
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center">
              AD
            </div>
            <div className="text-left pr-2">
              <span className="text-xs font-semibold text-slate-200 block">Admin Main</span>
              <span className="text-[10px] text-slate-500 block">Account #1</span>
            </div>
          </button>

          {/* Send custom */}
          <Link
            to="/transfer"
            className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-all text-xs font-semibold flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Custom Recipient</span>
          </Link>
        </div>
      </div>

      {/* ── Transaction History Section with Search & Tabs ─────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Top Controls: Title, Search, Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Transaction History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified ledger of deposits, transfers, and incoming payments
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('INFLOW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'INFLOW'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Inflow
              </button>
              <button
                onClick={() => setActiveTab('OUTFLOW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'OUTFLOW'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Outflow
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {txnLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500 animate-pulse">
                    Loading verified ledger transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-400">
                      No matching transactions found.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isSender = wallet && tx.senderWalletId === wallet.id;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Reference Number */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSender
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isSender ? '↑' : '↓'}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-200 block">
                              {tx.referenceNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {isSender ? `To Wallet #${tx.receiverWalletId}` : `From Wallet #${tx.senderWalletId || 'Gateway'}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 pr-4 text-xs font-semibold text-slate-300">
                        {tx.transactionType}
                      </td>

                      {/* Amount */}
                      <td className="py-4 pr-4 font-bold tabular-nums text-sm">
                        <span className={isSender ? 'text-rose-400' : 'text-emerald-400'}>
                          {isSender ? '− ' : '+ '}
                          {formatCurrency(tx.amount, wallet?.currency || 'INR')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 text-xs text-slate-400 font-mono">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded PIN Modal */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        mode="setup"
      />
    </div>
  );
}
