import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinModal from './PinModal';
import ProfileModal from './ProfileModal';

export default function Layout() {
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'update'>('setup');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openPinModal = (mode: 'setup' | 'update') => {
    setPinModalMode(mode);
    setPinModalOpen(true);
    setDropdownOpen(false);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
    setDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ── Executive Top Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  PayWallet
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PRO
                </span>
              </div>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold block">
                Executive Banking
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/add-funds"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              Add Funds
            </NavLink>
            <NavLink
              to="/transfer"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              Transfer
            </NavLink>
          </nav>

          {/* Top Right: PIN Alert & Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* PIN Warning Alert if not set */}
            {!user?.hasPinSet && (
              <button
                onClick={() => openPinModal('setup')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors animate-pulse"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Set Up PIN</span>
              </button>
            )}

            {/* Profile Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-semibold text-slate-200 block truncate max-w-[130px]">
                    {user?.email}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    Verified
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 text-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Header */}
                  <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Signed in as
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {user?.email}
                    </span>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-0.5">
                    {/* View Profile */}
                    <button
                      onClick={openProfileModal}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>My Profile</span>
                    </button>

                    {/* PIN Setup / Update */}
                    <button
                      onClick={() => openPinModal(user?.hasPinSet ? 'update' : 'setup')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>{user?.hasPinSet ? 'Change PIN' : 'Set Up PIN'}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        user?.hasPinSet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {user?.hasPinSet ? 'ACTIVE' : 'NEEDED'}
                      </span>
                    </button>

                    {/* Security Settings */}
                    <button
                      onClick={openProfileModal}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings & Security</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-slate-800"></div>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-900/95 py-2 px-3">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex-1 text-center py-1.5 rounded-lg text-xs font-semibold ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/add-funds"
            className={({ isActive }) =>
              `flex-1 text-center py-1.5 rounded-lg text-xs font-semibold ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`
            }
          >
            Add Funds
          </NavLink>
          <NavLink
            to="/transfer"
            className={({ isActive }) =>
              `flex-1 text-center py-1.5 rounded-lg text-xs font-semibold ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`
            }
          >
            Transfer
          </NavLink>
        </div>
      </header>

      {/* ── Main Page Content ────────────────────────────────────────── */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* Global Modals */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        mode={pinModalMode}
      />
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenPinModal={openPinModal}
      />
    </div>
  );
}
