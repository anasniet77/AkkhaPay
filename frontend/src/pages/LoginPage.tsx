import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const registered = (location.state as { registered?: boolean })?.registered;

  // Flow control: 'CREDENTIALS' or 'OTP'
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');

  // Form states
  const [form, setForm] = useState({ email: '', password: '' });
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Resend OTP countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fillDemoAdmin = () => {
    setForm({ email: 'admin@paywallet.com', password: 'admin123' });
    setError('');
  };

  // Step 1: Submit email & password -> triggers Gmail OTP dispatch
  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);

      if (data.otpRequired) {
        setTargetEmail(data.email || form.email);
        setMaskedEmail(data.maskedEmail || form.email);
        setStep('OTP');
        setResendCooldown(60);
        setInfoMessage(data.message || 'Verification code sent to your registered Gmail.');
      } else {
        // Direct login fallback if OTP was disabled
        login(data.token, { id: data.userId, email: data.email, hasPinSet: data.hasPinSet });
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string }; status?: number } }).response;
      if (resp?.status === 401 || resp?.status === 403) {
        setError('Invalid email or password.');
      } else if (resp?.data?.message) {
        setError(resp.data.message);
      } else {
        setError('Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit OTP -> completes 2FA authentication
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-login-otp', {
        email: targetEmail,
        otp: otp.trim(),
      });

      login(data.token, { id: data.userId, email: data.email, hasPinSet: data.hasPinSet });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      setError(resp?.data?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/resend-login-otp', { email: targetEmail });
      setResendCooldown(60);
      setInfoMessage(data?.message || 'A fresh verification code has been dispatched.');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      setError(resp?.data?.message || 'Failed to resend OTP. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 sm:p-8 relative selection:bg-blue-600 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in duration-300">
        {/* Executive Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top sheen border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

          {step === 'CREDENTIALS' ? (
            <>
              {/* Brand Emblem */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-4 text-white shadow-xl shadow-blue-500/25">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  AkhhaPAY
                </h1>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-400 font-bold">
                  Executive Banking Portal
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                {registered && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Account created successfully. Please sign in.</span>
                  </div>
                )}

                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@paywallet.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Submit Button */}
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
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    'Continue with Email OTP →'
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-slate-800"></div>
                  <span className="absolute bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Fast Demo Access
                  </span>
                </div>

                {/* Demo Admin Auto-fill Button */}
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Auto-Fill Admin Credentials</span>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-xs text-slate-400">
                  Need a wallet?{' '}
                  <Link to="/register" className="text-blue-400 font-semibold hover:underline">
                    Register new account
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* ── STEP 2: 2FA OTP SCREEN ──────────────────────────────── */
            <>
              {/* Emblem */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center mb-4 text-white shadow-xl shadow-blue-500/25">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Two-Factor Authentication
                </h2>
                <p className="mt-1 text-xs text-slate-400 text-center">
                  A 6-digit OTP code has been dispatched to:
                </p>
                <div className="mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-mono text-blue-300 font-semibold">
                  {maskedEmail}
                </div>
              </div>

              {infoMessage && (
                <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs text-center">
                  {infoMessage}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="space-y-2 text-center">
                  <label htmlFor="otp" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Enter 6-Digit Gmail OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Check your registered inbox (and spam folder). Code expires in 5 minutes.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Verifying Security Code...</span>
                    </>
                  ) : (
                    'Verify & Access Account'
                  )}
                </button>

                {/* Resend & Back controls */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('CREDENTIALS');
                      setOtp('');
                      setError('');
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Change email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors font-semibold"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                {/* Demo Helper */}
                {targetEmail === 'admin@paywallet.com' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-center">
                    <span className="text-blue-400 font-bold">Admin Demo Tip:</span> Code dispatched to Gmail &amp; printed in server console. (Fallback bypass: <code className="text-white font-mono font-bold">123456</code>).
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
