import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top navigation ─────────────────────────────────────────── */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <span className="text-base font-semibold text-stone-800 tracking-tight">
            PayWallet
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-6">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-brand border-b-2 border-brand pb-0.5'
                    : 'text-stone-500 hover:text-stone-700'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/add-funds"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-brand border-b-2 border-brand pb-0.5'
                    : 'text-stone-500 hover:text-stone-700'
                }`
              }
            >
              Add Funds
            </NavLink>
            <NavLink
              to="/transfer"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-brand border-b-2 border-brand pb-0.5'
                    : 'text-stone-500 hover:text-stone-700'
                }`
              }
            >
              Transfer
            </NavLink>
          </nav>

          {/* User + sign out */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

