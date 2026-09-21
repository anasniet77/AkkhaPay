import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton, TableRowSkeleton } from '../components/SkeletonLoader';

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

function formatCurrency(amount: number, currency: string): string {
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

// ── Component ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-stone-900">
          Welcome back
        </h1>
        <p className="text-sm text-stone-500 mt-0.5">{user?.email}</p>
      </div>

      {error && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Blocked Wallet Warning ─────────────────────────────────── */}
      {wallet?.status === 'BLOCKED' && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">
                Your wallet is currently BLOCKED. Please contact support to resume transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Wallet Card ────────────────────────────────────────────── */}
      {walletLoading ? (
        <CardSkeleton />
      ) : wallet ? (
        <div className="bg-surface border border-border rounded-sm p-6">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Available Balance
          </p>
          <p className="mt-2 text-3xl font-semibold text-stone-900 tabular-nums">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
            <span>Currency: {wallet.currency}</span>
            <span
              className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${
                wallet.status === 'ACTIVE'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {wallet.status}
            </span>
          </div>
        </div>
      ) : null}

      {/* ── Transaction History ─────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-stone-900 mb-4">
          Transaction History
        </h2>

        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Reference
                </th>
                <th className="px-4 py-3 text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {txnLoading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-stone-400"
                  >
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isSender =
                    wallet && txn.senderWalletId === wallet.id;
                  return (
                    <tr key={txn.id} className="hover:bg-stone-50 transition-colors duration-100">
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">
                        {txn.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {txn.transactionType}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium tabular-nums ${
                          isSender ? 'text-red-700' : 'text-green-700'
                        }`}
                      >
                        {isSender ? '−' : '+'}
                        {formatCurrency(txn.amount, wallet?.currency ?? 'INR')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${
                            txn.status === 'SUCCESS'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : txn.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {formatDate(txn.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

