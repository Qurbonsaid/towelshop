import React, { useMemo, useState } from 'react'
import {
  Clock,
  Edit,
  Receipt,
  Search,
  Trash2,
  User,
} from '../components/icons'

import { SaleEditModal } from '../components/SaleEditModal'
import { ROLES } from '../constants/roles'
import { useHeader } from '../context/HeaderContext'
import { uz } from '../i18n/uz'
import { deleteSale, updateSale } from '../services/firestoreService'
import { notifyAdminSafe } from '../services/pushService'
import {
  canEditSale,
  formatRemainingTime,
  getRemainingTimeMs,
} from '../utils/permissions'

export function SalesPage({ role, userId, userProfile, sales = [] }) {
  const isAdmin = role === ROLES.ADMIN
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSale, setEditingSale] = useState(null)

  // Configure header
  useHeader({
    title: uz.nav.sales,
    subtitle: `${sales.length} ta tranzaksiya`,
    showBack: false,
  }, [sales.length])

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = sales

    // If staff, can view their sales or all sales (firestore rules allow read for authenticated)
    if (q) {
      list = list.filter((s) =>
        (s.barberName && s.barberName.toLowerCase().includes(q)) ||
        (s.barbershopName && s.barbershopName.toLowerCase().includes(q)) ||
        (s.staffName && s.staffName.toLowerCase().includes(q))
      )
    }
    return list
  }, [sales, searchQuery])

  const handleSaveSale = async (id, data) => {
    await updateSale(id, data)

    // If edited by staff, notify admins via push notification
    if (!isAdmin) {
      const staffName = userProfile?.name || 'Xodim'
      const barberName = editingSale?.barberName || 'Sartarosh'
      const details = `${data.quantityDelivered ?? 0} dona toza, ${data.returnedTowels ?? 0} qaytarilgan`
      notifyAdminSafe(
        uz.notifications.titles.saleUpdated,
        uz.notifications.pushSaleUpdated(staffName, barberName, details)
      )
    }
  }

  const handleDeleteSale = async (id) => {
    if (window.confirm(uz.admin.masterLedger.deleteConfirm)) {
      await deleteSale(id)
    }
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-3.5 pb-6">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sartarosh, sartaroshxona yoki xodim ismi bo'yicha..."
          className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="space-y-2.5">
          {filteredSales.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Receipt size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">{uz.admin.masterLedger.noSales}</p>
            </div>
          ) : (
            filteredSales.map((sale) => {
              const eligibleForStaffEdit =
                !isAdmin &&
                canEditSale({
                  role,
                  staffId: sale.staffId,
                  currentUid: userId,
                  createdAt: sale.createdAt,
                })
              const remainingTimeMs = getRemainingTimeMs(sale.createdAt)
              const isExpired = remainingTimeMs <= 0

              return (
                <div
                  key={sale.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{sale.barberName}</h4>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-emerald-700">{sale.barbershopName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(sale.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-800">
                        {Number(sale.totalPrice || 0).toLocaleString()} {uz.common.sum}
                      </p>
                      {Number(sale.quantityDelivered) > 0 && (
                        <p className="text-[11px] font-bold text-slate-600">
                          {sale.quantityDelivered} dona toza
                        </p>
                      )}
                      {Number(sale.returnedTowels) > 0 && (
                        <p className="text-[11px] font-bold text-sky-700">
                          {sale.returnedTowels} dona qaytarildi
                        </p>
                      )}
                    </div>
                  </div>

                  {(Number(sale.cashAmount) > 0 ||
                    Number(sale.cardAmount) > 0 ||
                    Number(sale.discount) > 0) && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex-wrap">
                      <span className="font-bold text-slate-700">To'lov:</span>
                      {Number(sale.cashAmount) > 0 && (
                        <span className="font-semibold text-emerald-800">
                          Naqd: {Number(sale.cashAmount).toLocaleString()} so'm
                        </span>
                      )}
                      {Number(sale.cardAmount) > 0 && (
                        <span className="font-semibold text-sky-800">
                          Click: {Number(sale.cardAmount).toLocaleString()} so'm
                        </span>
                      )}
                      {Number(sale.discount) > 0 && (
                        <span className="font-semibold text-amber-800">
                          Chegirma: {Number(sale.discount).toLocaleString()} so'm
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      Xodim: <strong className="text-slate-700">{sale.staffName || 'Xodim'}</strong>
                    </span>

                    {/* Actions: Admin or 12-hour staff rule */}
                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingSale(sale)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200"
                            title={uz.common.edit}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale.id)}
                            className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                            title={uz.common.delete}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          {eligibleForStaffEdit ? (
                            <button
                              type="button"
                              onClick={() => setEditingSale(sale)}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 border border-amber-200 hover:bg-amber-100"
                            >
                              <Edit size={12} />
                              {formatRemainingTime(remainingTimeMs)}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {isExpired ? 'Muddati tugagan' : ''}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      {/* Edit Sale Modal */}
      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          isAdmin={isAdmin}
          onSave={handleSaveSale}
          onClose={() => setEditingSale(null)}
        />
      )}
    </div>
  )
}
