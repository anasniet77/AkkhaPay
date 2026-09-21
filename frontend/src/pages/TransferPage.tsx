import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/transactions/transfer', {
        senderUserId: user?.id,
        receiverUserId: Number(form.receiverUserId),
        amount: Number(form.amount),
      });

      addToast('success', 'Transfer completed successfully.');
      setForm({ receiverUserId: '', amount: '', pin: '' });
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      const message = resp?.data?.message || 'Transfer failed. Please try again.';
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-stone-900">
          Transfer Funds
        </h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Send money to another PayWallet user.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-sm p-6 max-w-lg space-y-5"
      >
        {/* Recipient */}
        <div>
          <label
            htmlFor="receiverUserId"
            className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1.5"
          >
            Recipient User ID
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
            placeholder="Enter recipient's user ID"
            className="w-full"
          />
          <p className="mt-1 text-xs text-stone-400">
            The numeric user ID of the recipient.
          </p>
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1.5"
          >
            Amount (INR)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="0.01"
            required
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full"
          />
        </div>

        {/* Transaction PIN (stub) */}
        <div>
          <label
            htmlFor="pin"
            className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1.5"
          >
            Transaction PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]{4}"
            value={form.pin}
            onChange={handleChange}
            placeholder="4-digit PIN"
            className="w-full max-w-32"
          />
          <p className="mt-1 text-xs text-stone-400">
            PIN verification will be enabled in a future update.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-brand text-white text-sm font-medium px-6 py-2.5 rounded-sm
                     hover:bg-brand-hover transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Send Money'}
        </button>
      </form>
    </div>
  );
}

