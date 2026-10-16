import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Lock, LogOut, Shield, User } from '../components/icons'

import { ROLES } from '../constants/roles'
import { useHeader } from '../context/HeaderContext'
import { uz } from '../i18n/uz'
import { updateUserProfile } from '../services/authService'
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '../utils/auth'

export function ProfilePage({ userProfile, onLogout }) {
  useHeader({
    title: uz.profile.title,
    subtitle: uz.profile.subtitle,
    showBack: true,
    backTo: '/sartaroshxonalar',
  }, [])

  const isAdmin = userProfile?.role === ROLES.ADMIN

  const [name, setName] = useState(userProfile?.name || '')
  const [phone, setPhone] = useState(userProfile?.phone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePhoneChange = (val) => {
    // Only accept numbers up to 9 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 9)
    setPhone(cleaned)
  }

  const isSensitiveFieldChanged =
    Boolean(phone && normalizePhone(phone) !== normalizePhone(userProfile?.phone)) ||
    Boolean(newPassword && newPassword.length > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError("Ism-familiyani kiritish majburiy!")
      return
    }

    if (!isValidPhone(phone)) {
      setError(uz.profile.invalidPhone)
      return
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError(uz.profile.passwordTooShort)
        return
      }
      if (newPassword !== confirmPassword) {
        setError(uz.profile.passwordMismatch)
        return
      }
    }

    if (isSensitiveFieldChanged && !currentPassword) {
      setError(uz.profile.currentPasswordRequired)
      return
    }

    setSaving(true)
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: normalizePhone(phone),
        currentPhone: userProfile?.phone,
        currentPassword,
        newPassword,
      })

      setSuccess(uz.profile.saveSuccess)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err.message || uz.common.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pb-8">
      {/* User Badge / Role Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            {isAdmin ? <Shield size={24} /> : <User size={24} />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{userProfile?.name || 'Foydalanuvchi'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isAdmin ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isAdmin ? uz.roles.admin : uz.roles.staff}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                +998 {formatPhoneDisplay(userProfile?.phone)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-xs font-medium animate-in fade-in duration-150">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-xs font-medium animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {uz.profile.nameLabel} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={uz.profile.namePlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {uz.profile.phoneLabel} *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">
                +998
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={uz.profile.phonePlaceholder}
                className="w-full rounded-xl border border-slate-300 pl-16 pr-3.5 py-2.5 text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            {phone && (
              <p className="mt-1 text-[11px] text-slate-500 font-mono">
                Ko'rinishi: +998 {formatPhoneDisplay(phone)}
              </p>
            )}
          </div>

          {/* Password & Security Constraints */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Lock size={14} className="text-emerald-600" />
              Xavfsizlik va parolni yangilash
            </h3>

            {isSensitiveFieldChanged && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-[11px] text-amber-800 font-medium">
                ⚠️ {uz.profile.currentPasswordHint}
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1 mb-3">
              <label className="block text-xs font-semibold text-slate-700">
                {uz.profile.currentPasswordLabel} {isSensitiveFieldChanged && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={uz.profile.currentPasswordPlaceholder}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${
                  isSensitiveFieldChanged && !currentPassword
                    ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                }`}
              />
              <span className="text-[10px] text-slate-400 block">
                {uz.profile.currentPasswordHint}
              </span>
            </div>

            {/* New Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.profile.newPasswordLabel}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={uz.profile.newPasswordPlaceholder}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.profile.confirmPasswordLabel}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={uz.profile.confirmPasswordPlaceholder}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-60"
            >
              {saving ? uz.common.loading : uz.profile.saveBtn}
            </button>
          </div>
        </form>
      </div>

      {/* Logout Action */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Tizimdan chiqish</h4>
            <p className="text-xs text-slate-500">Joriy hisobingizdan xavfsiz chiqish</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 active:scale-95 transition-all"
          >
            <LogOut size={15} />
            {uz.profile.logoutBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
