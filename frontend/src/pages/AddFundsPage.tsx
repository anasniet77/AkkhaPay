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

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderDetails.keyId,
        amount: orderDetails.amountInPaise || (depositAmount * 100), // paise
        currency: orderDetails.currency,
        name: 'PayWallet',
        description: 'Add Funds to Wallet',
        order_id: orderDetails.orderId || orderDetails.id,
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
          } catch {
            addToast('error', 'Payment verification failed.');
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        addToast('error', 'Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch {
      addToast('error', 'Could not initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-blue-400 font-bold block mb-1">
          Instant Deposit
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Add Funds
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
          Top up your wallet balance instantly via Razorpay Checkout.
        </p>
      </div>

      <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label
              htmlFor="amount"
              className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              Deposit Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-8 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Quick Amount Selectors */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quick Select Presets
            </span>
            <div className="flex flex-wrap gap-2.5">
              {quickAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    amount === amt.toString()
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !window.Razorpay}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Connecting Razorpay...</span>
                </>
              ) : (
                'Proceed to Payment Gateway'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
