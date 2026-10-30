import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, DollarSign, Package, TrendingUp } from './icons'
import { DebtorsModal } from './DebtorsModal'
import { uz } from '../i18n/uz'

export function AdminStatsCards({ sales = [], barbers = [], barbershops = [] }) {
  const navigate = useNavigate()
  const [isDebtorsModalOpen, setIsDebtorsModalOpen] = useState(false)
  const [debtorsModalTab, setDebtorsModalTab] = useState('debt')

  const stats = useMemo(() => {
    // oxlint-disable-next-line react/purity
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    let dailySum = 0
    let dailyCount = 0
    let dailyTowels = 0

    let monthlySum = 0
    let monthlyCount = 0
    let monthlyTowels = 0

    let allTimeSum = 0
    let allTimeCount = 0
    let allTimeTowels = 0

    sales.forEach((s) => {
      const time = s.createdAt?.toMillis
        ? s.createdAt.toMillis()
        : s.createdAt?.toDate
          ? s.createdAt.toDate().getTime()
          : s.createdAt
            ? new Date(s.createdAt).getTime()
            : (s.date ? new Date(`${s.date}T00:00:00`).getTime() : 0)
      const amount = Number(s.totalPrice) || 0
      const towels = Number(s.quantityDelivered) || 0

      allTimeSum += amount
      allTimeCount += 1
      allTimeTowels += towels

      if (time >= startOfMonth) {
        monthlySum += amount
        monthlyCount += 1
        monthlyTowels += towels
      }

      if (time >= startOfToday) {
        dailySum += amount
        dailyCount += 1
        dailyTowels += towels
      }
    })

    const debtorsCount = barbers.filter((b) => Number(b.debt || 0) > 0).length
    const overpaidCount = barbers.filter((b) => Number(b.overpaid || 0) > 0).length
    const totalDebt = barbers.reduce((acc, b) => acc + (Number(b.debt) || 0), 0)
    const totalOverpaid = barbers.reduce((acc, b) => acc + (Number(b.overpaid) || 0), 0)

    return {
      dailySum,
      dailyCount,
      dailyTowels,
      monthlySum,
      monthlyCount,
      monthlyTowels,
      allTimeSum,
      allTimeCount,
      allTimeTowels,
      totalDebt,
      totalOverpaid,
      debtorsCount,
      overpaidCount,
    }
  }, [sales, barbers])

  const {
    dailySum,
    dailyCount,
    dailyTowels,
    monthlySum,
    monthlyCount,
    monthlyTowels,
    allTimeSum,
    allTimeCount,
    allTimeTowels,
    totalDebt,
    totalOverpaid,
    debtorsCount,
    overpaidCount,
  } = stats

  const handleOpenDebtors = (tab = 'debt') => {
    setDebtorsModalTab(tab)
    setIsDebtorsModalOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* 3 Main Sales Volumes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Daily (Clickable -> Opens Daily Stats & Logs Page) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/statistika/kunlik')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/statistika/kunlik')
            }
          }}
          className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all"
          title="Bugungi hisobot va qarzlar jurnalini ko'rish"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-emerald-100">{uz.admin.stats.dailyTitle}</span>
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white group-hover:bg-white/30 transition-all">
                Batafsil →
              </span>
            </div>
            <div className="rounded-lg bg-emerald-400/30 p-1.5 group-hover:bg-emerald-400/50 transition-all">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight">{dailySum.toLocaleString()} {uz.common.sum}</p>
            <p className="text-xs text-emerald-100 mt-0.5">
              {dailyCount} {uz.admin.stats.salesCount} • {dailyTowels} {uz.admin.stats.towelCount}
            </p>
          </div>
        </div>

        {/* Monthly */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-100">{uz.admin.stats.monthlyTitle}</span>
            <div className="rounded-lg bg-sky-400/30 p-1.5">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight">{monthlySum.toLocaleString()} {uz.common.sum}</p>
            <p className="text-xs text-sky-100 mt-0.5">
              {monthlyCount} {uz.admin.stats.salesCount} • {monthlyTowels} {uz.admin.stats.towelCount}
            </p>
          </div>
        </div>

        {/* All-Time */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-100">{uz.admin.stats.allTimeTitle}</span>
            <div className="rounded-lg bg-indigo-400/30 p-1.5">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight">{allTimeSum.toLocaleString()} {uz.common.sum}</p>
            <p className="text-xs text-indigo-100 mt-0.5">
              {allTimeCount} {uz.admin.stats.salesCount} • {allTimeTowels} {uz.admin.stats.towelCount}
            </p>
          </div>
        </div>
      </div>

      {/* Debts and Overpayments Balance Cards (Both Clickable to view lists) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Debt (Clickable -> Opens Debtors list modal) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleOpenDebtors('debt')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleOpenDebtors('debt')
            }
          }}
          className="group relative flex flex-col justify-between rounded-2xl border border-red-200/90 bg-gradient-to-br from-red-50/90 to-rose-50/70 p-3.5 shadow-2xs cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.98] hover:border-red-300 transition-all text-left"
          title="Qarzdorlar ro'yxatini ko'rish"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1">
              <span>{uz.admin.stats.totalDebtTitle}</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100/90 px-2 py-0.5 text-[10px] font-bold text-red-800 group-hover:bg-red-200 transition-all">
              <span>Ro'yxat</span>
              <ChevronRight size={11} />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-black text-red-950 tracking-tight">
              {totalDebt.toLocaleString()} {uz.common.sum}
            </p>
            <p className="text-[11px] text-red-700 font-semibold mt-0.5">
              {debtorsCount > 0 ? `${debtorsCount} nafar qarzdor sartarosh` : "Qarzdorlar mavjud emas"}
            </p>
          </div>
        </div>

        {/* Total Overpaid (Clickable -> Opens Overpaid list modal) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleOpenDebtors('overpaid')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleOpenDebtors('overpaid')
            }
          }}
          className="group relative flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 p-3.5 shadow-2xs cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.98] hover:border-emerald-300 transition-all text-left"
          title="Ortiqcha to'lov qilgan sartaroshlar ro'yxatini ko'rish"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <span>{uz.admin.stats.totalOverpaidTitle}</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-800 group-hover:bg-emerald-200 transition-all">
              <span>Ro'yxat</span>
              <ChevronRight size={11} />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-black text-emerald-950 tracking-tight">
              {totalOverpaid.toLocaleString()} {uz.common.sum}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {overpaidCount > 0 ? `${overpaidCount} nafar sartaroshda haqdorlik` : "Ortiqcha to'lov mavjud emas"}
            </p>
          </div>
        </div>
      </div>

      {/* Debtors / Overpaid Full List Modal */}
      <DebtorsModal
        isOpen={isDebtorsModalOpen}
        onClose={() => setIsDebtorsModalOpen(false)}
        barbers={barbers}
        barbershops={barbershops}
        initialTab={debtorsModalTab}
      />
    </div>
  )
}
