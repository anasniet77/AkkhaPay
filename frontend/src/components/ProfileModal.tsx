import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPinModal: (mode: 'setup' | 'update') => void;
}

interface UserProfileData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  hasPinSet: boolean;
  createdAt: string;
}

export default function ProfileModal({ isOpen, onClose, onOpenPinModal }: ProfileModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      api
        .get(`/users/${user.id}/profile`)
        .then(({ data }) => setProfile(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-7 sm:p-8 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
        >
          &times;
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-100">
                {profile?.fullName || 'Account Holder'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            Loading secure profile data...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">Account ID</span>
                <span className="text-sm font-semibold text-slate-200 font-mono">#{profile?.id}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">System Role</span>
                <span className="text-sm font-semibold text-blue-400">{profile?.role}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">Registered Phone</span>
                <span className="text-sm font-semibold text-slate-200 font-mono">{profile?.phone}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">Member Since</span>
                <span className="text-sm font-semibold text-slate-200">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Security & Authentication
              </h4>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Transaction PIN</span>
                    <span className="text-[11px] text-slate-400 block">
                      {profile?.hasPinSet ? '4-digit authorization active' : 'Not set up yet'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPinModal(profile?.hasPinSet ? 'update' : 'setup');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-slate-700"
                >
                  {profile?.hasPinSet ? 'Change PIN' : 'Set Up PIN'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Two-Factor Encryption</span>
                    <span className="text-[11px] text-slate-400 block">AES-256 + HMAC-SHA256 active</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  PROTECTED
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
