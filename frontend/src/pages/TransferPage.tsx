import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import PinModal from '../components/PinModal';

export default function TransferPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    receiverUserId: '',
    amount: '',
    pin: '',
  });
  const [loading, setLoading] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user?.hasPinSet) {
      addToast('error', 'Please configure your 4-digit transaction PIN first.');
      setPinModalOpen(true);
      return;
    }

    if (!form.pin || form.pin.length !== 4) {
      addToast('error', 'Transaction PIN must be 4 digits.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/transactions/transfer', {
        senderUserId: user?.id,
        receiverUserId: Number(form.receiverUserId),
        amount: Number(form.amount),
        pin: form.pin,
      });

      addToast('success', 'Transfer completed successfully.');
      setForm({ receiverUserId: '', amount: '', pin: '' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      const message = resp?.data?.message || 'Transfer failed. Please check credentials or balance.';
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      {/* Heading */}
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-blue-400 font-bold block mb-1">
          Peer-To-Peer Transfer
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Send Money
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
          Transfer wallet funds securely with 4-digit PIN authorization.
        </p>
      </div>

      {/* Warning banner if PIN unset */}
      {!user?.hasPinSet && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-200">Transaction PIN Not Configured</p>
              <p className="text-[11px] text-amber-300/80">You must set up your security PIN before sending money.</p>
            </div>
          </div>
          <button
            onClick={() => setPinModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            Setup PIN
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient */}
          <div className="space-y-1.5">
            <label
              htmlFor="receiverUserId"
              className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              Recipient Account User ID
            </label>
            <input
              id="receiverUserId"
              name="receiverUserId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={form.receiverUserId}
              onChange={handleChange}
              placeholder="e.g. 2"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Enter the recipient&apos;s numeric ID (e.g. 2).
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label
              htmlFor="amount"
              className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              Transfer Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-8 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Security PIN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="pin"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
              >
                4-Digit Security PIN
              </label>
              <button
                type="button"
                onClick={() => setPinModalOpen(true)}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                {user?.hasPinSet ? 'Change PIN' : 'Set up PIN'}
              </button>
            </div>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              required
              value={form.pin}
              onChange={handleChange}
              placeholder="••••"
              className="w-36 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center tracking-widest text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500">
              Required to authorize this fund disbursement.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verifying PIN & Transferring...</span>
                </>
              ) : (
                'Authorize & Transfer Money'
              )}
            </button>
          </div>
        </form>
      </div>

      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        mode={user?.hasPinSet ? 'update' : 'setup'}
      />
    </div>
  );
}
