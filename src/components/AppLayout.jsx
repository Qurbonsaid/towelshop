import { Link, Outlet, useLocation } from 'react-router-dom'

import { ROLES } from '../constants/roles'
import { uz } from '../i18n/uz'

const linkClasses = (active) =>
  `rounded-xl px-3 py-2 text-sm font-medium ${
    active ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
  }`

export function AppLayout({ onLogout, role }) {
  const location = useLocation()
  const dashboardPath = role === ROLES.ADMIN ? '/admin' : '/staff'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">{uz.appName}</h1>
      </header>

      <main className="flex-1 px-4 py-4">
        <Outlet />
      </main>

      <nav className="grid grid-cols-3 gap-2 border-t border-slate-200 bg-white p-3">
        <Link className={linkClasses(location.pathname !== '/xarita')} to={dashboardPath}>
          {uz.common.dashboard}
        </Link>
        <Link className={linkClasses(location.pathname === '/xarita')} to="/xarita">
          {uz.common.map}
        </Link>
        <button
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          onClick={onLogout}
          type="button"
        >
          {uz.common.logout}
        </button>
      </nav>
    </div>
  )
}
