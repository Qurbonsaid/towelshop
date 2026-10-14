import { useState } from 'react'

import { uz } from '../i18n/uz'
import { isValidPhone } from '../utils/auth'

export function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isValidPhone(phone)) {
      setError(uz.login.phoneError)
      return
    }

    setError('')
    setLoading(true)

    try {
      await onLogin(phone, password)
    } catch {
      setError(uz.login.invalidCredentials)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-slate-50 px-4 py-10">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{uz.login.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{uz.login.subtitle}</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">{uz.login.phoneLabel}</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none ring-emerald-500 focus:ring"
              inputMode="numeric"
              maxLength={9}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="901234567"
              required
              value={phone}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">{uz.login.passwordLabel}</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none ring-emerald-500 focus:ring"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-medium text-white active:bg-emerald-700"
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
