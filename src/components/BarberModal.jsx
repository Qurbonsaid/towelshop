import React, { useState } from "react";
import { AlertCircle, Scissors, Trash2, X } from "./icons";

import { CONTRACT_TYPES } from "../constants/models";
import { uz } from "../i18n/uz";

export function BarberModal({
  barber,
  barbershops = [],
  preselectedShopId,
  isAdmin = false,
  onSave,
  onDelete,
  onClose,
}) {
  const [barbershopId, setBarbershopId] = useState(
    barber?.barbershopId || preselectedShopId || "",
  );
  const [name, setName] = useState(barber?.name || "");
  const [phone, setPhone] = useState(barber?.phone || "");
  const [contractType, setContractType] = useState(
    barber?.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN,
  );
  const [pricePerTowel, setPricePerTowel] = useState(
    barber?.pricePerTowel ?? 3000,
  );
  const [towelsCount, setTowelsCount] = useState(
    barber?.towelsCount ?? barber?.initialTowels ?? 0,
  );
  const [debt, setDebt] = useState(barber?.debt ?? 0);
  const [overpaid, setOverpaid] = useState(barber?.overpaid ?? 0);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !barbershopId) return;

    setSaving(true);
    try {
      await onSave({
        barbershopId,
        name: name.trim(),
        phone: phone.trim(),
        contractType,
        pricePerTowel: Number(pricePerTowel) || 0,
        towelsCount: Number(towelsCount) || 0,
        debt: Number(debt) || 0,
        overpaid: Number(overpaid) || 0,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(uz.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !barber) return;
    setDeleting(true);
    try {
      await onDelete(barber.id);
      onClose();
    } catch (err) {
      console.error("Delete barber error:", err);
      alert(uz.common.error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Scissors size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {barber ? uz.common.edit : uz.admin.barbers.addBtn}
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
          {/* Barbershop selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.barbers.barbershopLabel} *
            </label>
            <select
              required
              value={barbershopId}
              onChange={(e) => setBarbershopId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
            >
              <option value="">Sartaroshxonani tanlang</option>
              {barbershops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.barbers.nameLabel} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={uz.admin.barbers.namePlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.barbers.phoneLabel}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={uz.admin.barbers.phonePlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Contract Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {uz.admin.barbers.contractTypeLabel} *
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                  contractType === CONTRACT_TYPES.PAY_FOR_TAKEN
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="contractType"
                  value={CONTRACT_TYPES.PAY_FOR_TAKEN}
                  checked={contractType === CONTRACT_TYPES.PAY_FOR_TAKEN}
                  onChange={() => setContractType(CONTRACT_TYPES.PAY_FOR_TAKEN)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold block">
                    {uz.contractTypes.payForTaken}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    {uz.contractTypes.payForTakenDesc}
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                  contractType === CONTRACT_TYPES.PAY_FOR_USED
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="contractType"
                  value={CONTRACT_TYPES.PAY_FOR_USED}
                  checked={contractType === CONTRACT_TYPES.PAY_FOR_USED}
                  onChange={() => setContractType(CONTRACT_TYPES.PAY_FOR_USED)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold block">
                    {uz.contractTypes.payForUsed}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    {uz.contractTypes.payForUsedDesc}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Price per towel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.barbers.priceLabel} *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                required
                value={pricePerTowel}
                onChange={(e) => setPricePerTowel(e.target.value)}
                placeholder={uz.admin.barbers.pricePlaceholder}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                {uz.common.sum}
              </span>
            </div>
          </div>

          {/* Towel balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Undagi bor sochiqlar soni (dona)
            </label>
            <input
              type="number"
              min="0"
              value={towelsCount}
              onChange={(e) => setTowelsCount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500"
            />
          </div>

          {/* Debt / Overpaid balance */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Qarzi (so'm)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={debt}
                onChange={(e) => setDebt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Haqdorlik / Ortiqcha to'lov (so'm)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={overpaid}
                onChange={(e) => setOverpaid(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500"
              />
            </div>
          </div>

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
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? uz.common.loading : uz.common.save}
            </button>
          </div>

          {barber && onDelete && isAdmin && (
            <div className="pt-3 border-t border-red-100 text-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-red-200 bg-red-50/70 py-2 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-98 transition-all"
              >
                <Trash2 size={14} />
                {uz.barberDetails.deleteBarber}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-3 mx-auto">
              <AlertCircle size={28} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 text-center">
              {uz.barberDetails.deleteBarberConfirmTitle}
            </h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed text-center font-medium">
              {uz.barberDetails.deleteBarberConfirmDesc}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-900 text-center bg-slate-100 py-1.5 px-3 rounded-lg">
              {barber.name}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {uz.common.cancel}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? uz.common.loading : uz.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
