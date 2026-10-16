import React, { useState } from "react";
import { Check, Users, X } from "./icons";
import { ROLES } from "../constants/roles";
import { uz } from "../i18n/uz";
import { isValidPhone, normalizePhone } from "../utils/auth";

export function StaffModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(phone);

    if (!isValidPhone(cleanPhone)) {
      setError(uz.login.phoneError);
      return;
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi shart");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        phone: cleanPhone,
        password,
        role: ROLES.STAFF,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || uz.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Users size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {uz.admin.staff.addBtn}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.staff.nameLabel} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={uz.admin.staff.namePlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.staff.phoneLabel} *
            </label>
            <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
              <span className="flex items-center bg-slate-50 px-3 text-xs font-semibold text-slate-500 border-r border-slate-200">
                +998
              </span>
              <input
                type="tel"
                required
                maxLength={9}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={uz.admin.staff.phonePlaceholder}
                className="w-full px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.staff.passwordLabel} *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={uz.admin.staff.passwordPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="mt-5 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {uz.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {saving ? uz.common.loading : uz.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
