import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const registered = (location.state as { registered?: boolean })?.registered;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, { id: data.userId, email: data.email });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string }; status?: number } }).response;
      if (resp?.status === 401 || resp?.status === 403) {
        setError('Invalid email or password.');
      } else if (resp?.data?.message) {
        setError(resp.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
            Sign in to PayWallet
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Enter your credentials to access your account.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-sm p-6 space-y-5"
        >
          {registered && (
            <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-sm px-4 py-3">
              Account created successfully. Please sign in.
            </div>
          )}

          {error && (
            <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white text-sm font-medium py-2.5 rounded-sm
                       hover:bg-brand-hover transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-5 text-center text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

