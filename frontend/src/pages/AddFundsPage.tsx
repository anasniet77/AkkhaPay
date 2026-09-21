import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

// Extend window for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function AddFundsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const depositAmount = Number(amount);
    if (depositAmount < 1) {
      addToast('error', 'Amount must be at least 1 INR.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create order on backend
      const { data: orderDetails } = await api.post('/payments/create-order', {
        userId: user.id,
        amount: depositAmount,
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderDetails.amount * 100, // paise
        currency: orderDetails.currency,
        name: 'PayWallet',
        description: 'Add Funds to Wallet',
        order_id: orderDetails.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              userId: user.id,
              amount: depositAmount,
            });

            addToast('success', 'Funds added successfully.');
            navigate('/dashboard');
          } catch (verifyErr) {
            addToast('error', 'Payment verification failed.');
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#0c3b5e', // brand color
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        addToast('error', 'Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      addToast('error', 'Could not initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-stone-900">Add Funds</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Top up your wallet balance securely via Razorpay.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-sm p-6 max-w-lg space-y-5"
      >
        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1.5"
          >
            Amount (INR)
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full"
          />
        </div>

        <div className="border-t border-border" />

        <button
          type="submit"
          disabled={loading || !window.Razorpay}
          className="bg-brand text-white text-sm font-medium px-6 py-2.5 rounded-sm
                     hover:bg-brand-hover transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Proceed to Pay'}
        </button>
      </form>
    </div>
  );
}

