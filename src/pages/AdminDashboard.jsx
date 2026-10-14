import { uz } from '../i18n/uz'

export function AdminDashboard() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">{uz.admin.title}</h2>

      <div className="grid grid-cols-3 gap-2">
        <article className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">{uz.admin.daily}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">0 so\'m</p>
        </article>
        <article className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">{uz.admin.monthly}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">0 so\'m</p>
        </article>
        <article className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">{uz.admin.allTime}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">0 so\'m</p>
        </article>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-700">{uz.admin.manage}</p>
        <p className="mt-2 text-sm text-slate-500">{uz.admin.fullEdit}</p>
      </div>
    </section>
  )
}
