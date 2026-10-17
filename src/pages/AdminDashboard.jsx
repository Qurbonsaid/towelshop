import React, { useEffect, useMemo, useState } from 'react'
import {
  AdminPushBanner,
} from '../components/AdminPushBanner'
import {
  AdminStatsCards,
} from '../components/AdminStatsCards'
import {
  BarberModal,
} from '../components/BarberModal'
import {
  BarberPaymentModal,
} from '../components/BarberPaymentModal'
import {
  BarbershopModal,
} from '../components/BarbershopModal'
import {
  SaleEditModal,
} from '../components/SaleEditModal'
import {
  StaffModal,
} from '../components/StaffModal'
import {
  Building2,
  Clock,
  Edit,
  MapPin,
  Package,
  Phone,
  Plus,
  Receipt,
  RotateCcw,
  Scissors,
  Search,
  Shield,
  Trash2,
  User,
  Users,
} from '../components/icons'
import { CONTRACT_TYPES } from '../constants/models'
import { ROLES } from '../constants/roles'
import { uz } from '../i18n/uz'
import { createStaffAccount } from '../services/authService'
import {
  createBarber,
  createBarbershop,
  deleteBarber,
  deleteBarbershop,
  deleteSale,
  deleteUserDoc,
  recordBarberPayment,
  subscribeBarbers,
  subscribeBarbershops,
  subscribeReturns,
  subscribeSales,
  subscribeUsers,
  updateBarber,
  updateBarbershop,
  updateSale,
} from '../services/firestoreService'

const TABS = {
  STATS: 'stats',
  SALES: 'sales',
  RETURNS: 'returns',
  BARBERSHOPS: 'barbershops',
  BARBERS: 'barbers',
  STAFF: 'staff',
}

export function AdminDashboard({ adminUser }) {
  const [activeTab, setActiveTab] = useState(TABS.STATS)

  // Real-time collections data
  const [barbershops, setBarbershops] = useState([])
  const [barbers, setBarbers] = useState([])
  const [sales, setSales] = useState([])
  const [returns, setReturns] = useState([])
  const [users, setUsers] = useState([])

  // Modal states
  const [selectedShop, setSelectedShop] = useState(null)
  const [isShopModalOpen, setIsShopModalOpen] = useState(false)

  const [selectedBarber, setSelectedBarber] = useState(null)
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false)
  const [paymentBarber, setPaymentBarber] = useState(null)

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [shopFilter, setShopFilter] = useState('')

  // Subscriptions
  useEffect(() => {
    const unsubShops = subscribeBarbershops(setBarbershops)
    const unsubBarbers = subscribeBarbers(setBarbers)
    const unsubSales = subscribeSales(setSales)
    const unsubReturns = subscribeReturns(setReturns)
    const unsubUsers = subscribeUsers(setUsers)

    return () => {
      unsubShops()
      unsubBarbers()
      unsubSales()
      unsubReturns()
      unsubUsers()
    }
  }, [])

  // Filtered lists
  const filteredBarbers = useMemo(() => {
    return barbers.filter((b) => {
      const matchShop = !shopFilter || b.barbershopId === shopFilter
      const matchQuery =
        !searchQuery ||
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone?.includes(searchQuery)
      return matchShop && matchQuery
    })
  }, [barbers, shopFilter, searchQuery])

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        s.barberName?.toLowerCase().includes(q) ||
        s.barbershopName?.toLowerCase().includes(q) ||
        s.staffName?.toLowerCase().includes(q)
      )
    })
  }, [sales, searchQuery])

  // Handlers for Barbershop CRUD
  const handleSaveShop = async (shopData) => {
    if (selectedShop) {
      await updateBarbershop(selectedShop.id, shopData)
    } else {
      await createBarbershop(shopData)
    }
    setSelectedShop(null)
  }

  const handleDeleteShop = async (shopId) => {
    if (window.confirm(uz.admin.barbershops.deleteConfirm)) {
      await deleteBarbershop(shopId)
    }
  }

  // Handlers for Barber CRUD
  const handleSaveBarber = async (barberData) => {
    if (selectedBarber) {
      await updateBarber(selectedBarber.id, barberData)
    } else {
      await createBarber(barberData)
    }
    setSelectedBarber(null)
  }

  const handleDeleteBarber = async (barberId) => {
    if (window.confirm(uz.admin.barbers.deleteConfirm)) {
      await deleteBarber(barberId)
    }
  }

  const handleRecordPayment = async (barberId, amount) => {
    await recordBarberPayment(barberId, amount)
  }

  // Handlers for Staff Creation & Deletion
  const handleCreateStaff = async (staffData) => {
    await createStaffAccount(staffData)
  }

  const handleDeleteStaff = async (uid) => {
    if (window.confirm(uz.admin.staff.deleteConfirm)) {
      await deleteUserDoc(uid)
    }
  }

  // Master Sales Ledger Handlers (unlimited edit for Admin)
  const handleUpdateSale = async (saleId, data) => {
    await updateSale(saleId, data)
  }

  const handleDeleteSale = async (saleId) => {
    if (window.confirm(uz.admin.masterLedger.deleteConfirm)) {
      await deleteSale(saleId)
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{uz.admin.title}</h2>
          <p className="text-xs text-slate-500">{uz.admin.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <Shield size={14} />
          <span>{uz.roles.admin}</span>
        </div>
      </div>

      {/* FCM Push Notification Banner */}
      <AdminPushBanner adminUid={adminUser?.uid} />

      {/* Navigation Tabs (Scrollable on small phones) */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl bg-slate-200/70 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab(TABS.STATS)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 font-semibold transition-all ${
            activeTab === TABS.STATS
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt size={14} />
          {uz.admin.tabs.stats}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(TABS.SALES)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 font-semibold transition-all ${
            activeTab === TABS.SALES
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package size={14} />
          {uz.admin.tabs.sales} ({sales.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(TABS.RETURNS)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 font-semibold transition-all ${
            activeTab === TABS.RETURNS
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw size={14} />
          {uz.admin.tabs.returns} ({returns.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(TABS.BARBERSHOPS)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 font-semibold transition-all ${
            activeTab === TABS.BARBERSHOPS
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 size={14} />
          {uz.admin.tabs.barbershops} ({barbershops.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(TABS.BARBERS)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 font-semibold transition-all ${
            activeTab === TABS.BARBERS
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scissors size={14} />
          {uz.admin.tabs.barbers} ({barbers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(TABS.STAFF)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 font-semibold transition-all ${
            activeTab === TABS.STAFF
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          {uz.admin.tabs.staff} ({users.length})
        </button>
      </div>

      {/* TAB 1: STATS & OVERVIEW */}
      {activeTab === TABS.STATS && (
        <div className="space-y-4">
          <AdminStatsCards barbers={barbers} sales={sales} />

          {/* Quick summary lists */}
          <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock size={16} className="text-emerald-600" />
                Eng so'nggi sotuvlar
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab(TABS.SALES)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Barchasi ({sales.length})
              </button>
            </div>

            {sales.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">{uz.admin.masterLedger.noSales}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{sale.barberName}</p>
                      <p className="text-[11px] text-slate-500">
                        {sale.barbershopName} • {sale.staffName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {Number(sale.totalPrice).toLocaleString()} {uz.common.sum}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {sale.quantityDelivered} {uz.common.pcs}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MASTER SALES LEDGER */}
      {activeTab === TABS.SALES && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900 flex items-start gap-2">
            <Shield className="text-emerald-700 shrink-0 mt-0.5" size={16} />
            <p>{uz.admin.masterLedger.fullEditNotice}</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={uz.admin.masterLedger.searchPlaceholder}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {filteredSales.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-400 border border-slate-200">
              {uz.admin.masterLedger.noSales}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSales.map((sale) => {
                const dateStr = sale.createdAt?.toDate
                  ? sale.createdAt.toDate().toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
                  : ''
                return (
                  <div
                    key={sale.id}
                    className="flex flex-col justify-between rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{sale.barberName}</span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                            {sale.contractType === CONTRACT_TYPES.PAY_FOR_USED ? 'Ishlatilgan' : 'Olingan'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {sale.barbershopName} • Xodim: <span className="font-medium text-slate-700">{sale.staffName}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700 block">
                          {Number(sale.totalPrice).toLocaleString()} {uz.common.sum}
                        </span>
                        <span className="text-xs text-slate-500">
                          {sale.quantityDelivered} dona × {Number(sale.unitPrice).toLocaleString()} {uz.common.sum}
                        </span>
                      </div>
                    </div>

                    {sale.note && (
                      <p className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600 italic">
                        "{sale.note}"
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                      <span>{dateStr}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingSale(sale)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit size={12} />
                          {uz.common.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RETURNS LEDGER */}
      {activeTab === TABS.RETURNS && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">{uz.admin.returnsLedger.title}</h3>
          {returns.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-400 border border-slate-200">
              {uz.admin.returnsLedger.noReturns}
            </div>
          ) : (
            <div className="space-y-2">
              {returns.map((item) => {
                const dateStr = item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
                  : ''
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.barberName}</p>
                      <p className="text-slate-500">
                        {item.barbershopName} • Xodim: {item.staffName}
                      </p>
                      {item.note && <p className="text-slate-400 italic mt-0.5">"{item.note}"</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{dateStr}</p>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 rounded-xl bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200">
                        <RotateCcw size={13} />
                        <span>{item.returnedTowels} {uz.common.pcs}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BARBERSHOPS CRUD */}
      {activeTab === TABS.BARBERSHOPS && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{uz.admin.barbershops.title}</h3>
            <button
              type="button"
              onClick={() => {
                setSelectedShop(null)
                setIsShopModalOpen(true)
              }}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
            >
              <Plus size={14} />
              {uz.admin.barbershops.addBtn}
            </button>
          </div>

          <div className="space-y-2.5">
            {barbershops.map((shop) => {
              const shopBarbersCount = barbers.filter((b) => b.barbershopId === shop.id).length
              const hasCoords = shop.latitude !== null && shop.longitude !== null

              return (
                <div
                  key={shop.id}
                  className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 size={16} className="text-emerald-600" />
                        {shop.name}
                      </h4>
                      {shop.address && (
                        <p className="text-xs text-slate-500 mt-0.5">{shop.address}</p>
                      )}
                      {shop.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} /> {shop.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShop(shop)
                          setIsShopModalOpen(true)
                        }}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShop(shop.id)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {shopBarbersCount} {uz.admin.barbershops.totalBarbers}
                    </span>

                    {hasCoords ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <MapPin size={12} />
                        {shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {uz.admin.barbershops.noLocationSelected}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BARBERS CRUD */}
      {activeTab === TABS.BARBERS && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{uz.admin.barbers.title}</h3>
            <button
              type="button"
              onClick={() => {
                setSelectedBarber(null)
                setIsBarberModalOpen(true)
              }}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
            >
              <Plus size={14} />
              {uz.admin.barbers.addBtn}
            </button>
          </div>

          {/* Barbershop filter dropdown */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
            >
              <option value="">Barcha sartaroshxonalar</option>
              {barbershops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sartarosh ismi..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredBarbers.map((barber) => {
              const shop = barbershops.find((s) => s.id === barber.barbershopId)
              const hasDebt = (barber.debt || 0) > 0
              const hasOverpaid = (barber.overpaid || 0) > 0

              return (
                <div
                  key={barber.id}
                  className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Scissors size={15} className="text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">{barber.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {shop?.name || 'Sartaroshxona'} {barber.phone ? `• ${barber.phone}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentBarber(barber)}
                        title={uz.admin.barbers.settlePaymentBtn}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        + To'lov
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBarber(barber)
                          setIsBarberModalOpen(true)
                        }}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBarber(barber.id)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block">1 ta sochiq</span>
                      <span className="font-bold text-slate-800">
                        {Number(barber.pricePerTowel || 0).toLocaleString()} {uz.common.sum}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Qarz</span>
                      <span className={`font-bold ${hasDebt ? 'text-red-600' : 'text-slate-400'}`}>
                        {Number(barber.debt || 0).toLocaleString()} {uz.common.sum}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Haqdorlik</span>
                      <span className={`font-bold ${hasOverpaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {Number(barber.overpaid || 0).toLocaleString()} {uz.common.sum}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Shartnoma:</span>
                    <span className="font-semibold text-slate-700">
                      {barber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                        ? uz.contractTypes.payForUsed
                        : uz.contractTypes.payForTaken}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 6: STAFF CRUD */}
      {activeTab === TABS.STAFF && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{uz.admin.staff.title}</h3>
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
            >
              <Plus size={14} />
              {uz.admin.staff.addBtn}
            </button>
          </div>

          <div className="space-y-2.5">
            {users.map((u) => {
              const isAdmin = u.role === ROLES.ADMIN
              const staffSalesCount = sales.filter((s) => s.staffId === u.uid).length

              return (
                <div
                  key={u.uid}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-xs border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                        isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isAdmin ? <Shield size={18} /> : <User size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{u.name || 'Xodim'}</h4>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isAdmin ? uz.roles.admin : uz.roles.staff}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tel: {u.phone} • {staffSalesCount} ta sotuv qilgan
                      </p>
                    </div>
                  </div>

                  {u.uid !== adminUser?.uid && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(u.uid)}
                      className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {isShopModalOpen && (
        <BarbershopModal
          barbershop={selectedShop}
          isAdmin
          onSave={handleSaveShop}
          onClose={() => {
            setIsShopModalOpen(false)
            setSelectedShop(null)
          }}
        />
      )}

      {isBarberModalOpen && (
        <BarberModal
          barber={selectedBarber}
          barbershops={barbershops}
          isAdmin
          onSave={handleSaveBarber}
          onClose={() => {
            setIsBarberModalOpen(false)
            setSelectedBarber(null)
          }}
        />
      )}

      {paymentBarber && (
        <BarberPaymentModal
          barber={paymentBarber}
          onSave={handleRecordPayment}
          onClose={() => setPaymentBarber(null)}
        />
      )}

      {isStaffModalOpen && (
        <StaffModal
          onSave={handleCreateStaff}
          onClose={() => setIsStaffModalOpen(false)}
        />
      )}

      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          isAdmin={true}
          onSave={handleUpdateSale}
          onClose={() => setEditingSale(null)}
        />
      )}
    </div>
  )
}
