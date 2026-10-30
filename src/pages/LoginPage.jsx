import React, { useState } from 'react'
import { AlertCircle, Lock, Package } from '../components/icons'
import { uz } from '../i18n/uz'
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '../utils/auth'

export function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneChange = (e) => {
    const raw = e.target.value
    const digits = normalizePhone(raw).slice(0, 9)
    setPhone(digits)
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cleanPhone = normalizePhone(phone)

    if (!isValidPhone(cleanPhone)) {
      setError(uz.login.phoneError)
      return
    }

    setError('')
    setLoading(true)

    try {
      await onLogin(cleanPhone, password)
    } catch (err) {
      console.error('Login error:', err)
      const message =
        err.message === "Foydalanuvchi ma'lumotlar bazasida topilmadi"
          ? err.message
          : uz.login.invalidCredentials
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-slate-50 px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <Package size={32} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">{uz.appName}</h1>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          {uz.appDescription}
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">{uz.login.title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{uz.login.subtitle}</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {/* Phone Input with Auto-Masking */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.login.phoneLabel} *
            </label>
            <div className="flex rounded-2xl border border-slate-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 transition-all">
              <span className="flex items-center bg-slate-50 px-3.5 text-xs font-bold text-slate-600 border-r border-slate-200 select-none">
                +998
              </span>
              <input
                className="w-full px-3.5 py-3 text-base font-semibold tracking-wide outline-none placeholder:font-normal placeholder:text-slate-400"
                inputMode="numeric"
                maxLength={12} // allows space formatting
                onChange={handlePhoneChange}
                placeholder={uz.login.phonePlaceholder}
                required
                value={formatPhoneDisplay(phone)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.login.passwordLabel} *
            </label>
            <div className="flex rounded-2xl border border-slate-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 transition-all">
              <span className="flex items-center bg-slate-50 px-3.5 text-slate-400 border-r border-slate-200">
                <Lock size={16} />
              </span>
              <input
                className="w-full px-3.5 py-3 text-base font-medium outline-none placeholder:text-slate-400"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={uz.login.passwordPlaceholder}
                required
                type="password"
                value={password}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? uz.login.loading : uz.login.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
