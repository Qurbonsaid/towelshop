import React, { useEffect, useState } from 'react'
import { Bell, BellRing, Check } from './icons'
import { uz } from '../i18n/uz'
import { registerFcmForAdmin, triggerLocalTestNotification } from '../services/fcmService'

export function AdminPushBanner({ adminUid }) {
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [loading, setLoading] = useState(false)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' && adminUid) {
        registerFcmForAdmin(adminUid)
      }
    }
  }, [adminUid])

  const handleEnablePush = async () => {
    setLoading(true)
    await registerFcmForAdmin(adminUid)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    setLoading(false)
  }

  const handleSendTestNotification = () => {
    const sent = triggerLocalTestNotification()
    if (sent) {
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    }
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <BellRing size={16} />
          </div>
          <div>
            <span className="font-semibold block">{uz.fcm.statusActive}</span>
            <span className="text-[11px] text-emerald-600">Yangi sotuvlar kelganda darhol xabar olasiz</span>
          </div>
        </div>
        <button
          onClick={handleSendTestNotification}
          type="button"
          className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 font-medium text-emerald-700 shadow-xs hover:bg-emerald-50 active:scale-95"
        >
          {testSent ? <span className="flex items-center gap-1"><Check size={12} /> {uz.fcm.testSent}</span> : uz.fcm.testBtn}
        </button>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Bell size={16} />
        </div>
        <p className="flex-1">{uz.fcm.statusDenied}. Brauzer sozlamalaridan bildirishnomalarga ruxsat bering.</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <BellRing size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900">{uz.fcm.bannerTitle}</h4>
          <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{uz.fcm.bannerText}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleEnablePush}
              disabled={loading}
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
            >
              <Bell size={14} />
              {loading ? uz.common.loading : uz.fcm.enableBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
