import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'setup' | 'update';
  onSuccess?: () => void;
}

export default function PinModal({ isOpen, onClose, mode, onSuccess }: PinModalProps) {
  const { user, updatePinStatus } = useAuth();
  const { addToast } = useToast();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Confirmation PIN does not match.');
      return;
    }

    if (mode === 'update') {
      if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
        setError('Current PIN must be 4 numeric digits.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'setup') {
        await api.post(`/users/${user.id}/pin/setup`, { pin: newPin });
        updatePinStatus(true);
        addToast('success', 'Transaction PIN successfully set up.');
      } else {
        await api.post(`/users/${user.id}/pin/update`, {
          currentPin,
          newPin,
        });
        addToast('success', 'Transaction PIN updated successfully.');
      }

      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      setError(resp?.data?.message || 'Failed to update PIN. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-7 sm:p-8 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
        >
          &times;
        </button>

        {/* Header Emblem */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {mode === 'setup' ? 'Set Up Security PIN' : 'Change Security PIN'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'setup'
                ? 'Required for authorization on all outgoing fund transfers'
                : 'Enter current PIN and choose a new 4-digit code'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'update' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Current 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]{4}"
                inputMode="numeric"
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {mode === 'setup' ? 'Create 4-Digit PIN' : 'New 4-Digit PIN'}
            </label>
            <input
              type="password"
              maxLength={4}
              pattern="[0-9]{4}"
              inputMode="numeric"
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm 4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={4}
              pattern="[0-9]{4}"
              inputMode="numeric"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'setup' ? 'Save & Activate PIN' : 'Update PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
