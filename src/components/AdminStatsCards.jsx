import React, { useMemo } from 'react'
import { AlertCircle, DollarSign, Package, TrendingUp } from './icons'
import { uz } from '../i18n/uz'

export function AdminStatsCards({ sales = [], barbers = [] }) {
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
      const time = s.createdAt?.toMillis ? s.createdAt.toMillis() : (s.createdAt ? new Date(s.createdAt).getTime() : 0)
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
  } = stats

  return (
    <div className="space-y-3">
      {/* 3 Main Sales Volumes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Daily */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-100">{uz.admin.stats.dailyTitle}</span>
            <div className="rounded-lg bg-emerald-400/30 p-1.5">
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

      {/* Debts and Overpayments Balance Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-700">{uz.admin.stats.totalDebtTitle}</span>
            <AlertCircle className="text-red-500" size={16} />
          </div>
          <p className="mt-1 text-lg font-bold text-red-900">{totalDebt.toLocaleString()} {uz.common.sum}</p>
          <p className="text-[11px] text-red-600">Sartaroshlarning jami qarzlari</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">{uz.admin.stats.totalOverpaidTitle}</span>
            <DollarSign className="text-emerald-500" size={16} />
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-900">{totalOverpaid.toLocaleString()} {uz.common.sum}</p>
          <p className="text-[11px] text-emerald-600">Oldindan to'langan summalar</p>
        </div>
      </div>
    </div>
  )
}
