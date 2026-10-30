import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Phone,
  Scissors,
  Search,
  X,
} from "./icons";
import { uz } from "../i18n/uz";
import { formatPhoneDisplay } from "../utils/auth";

export function DebtorsModal({
  isOpen,
  onClose,
  barbers = [],
  barbershops = [],
  initialTab = "debt", // 'debt' | 'overpaid'
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const shopMap = useMemo(() => {
    const map = new Map();
    barbershops.forEach((s) => {
      if (s?.id) map.set(s.id, s.name);
    });
    return map;
  }, [barbershops]);

  // All debtors (debt > 0) sorted highest debt first
  const allDebtors = useMemo(() => {
    return barbers
      .filter((b) => Number(b.debt || 0) > 0)
      .sort((a, b) => (Number(b.debt) || 0) - (Number(a.debt) || 0));
  }, [barbers]);

  // All overpaid barbers (overpaid > 0) sorted highest overpaid first
  const allOverpaid = useMemo(() => {
    return barbers
      .filter((b) => Number(b.overpaid || 0) > 0)
      .sort((a, b) => (Number(b.overpaid) || 0) - (Number(a.overpaid) || 0));
  }, [barbers]);

  const totalDebtSum = useMemo(() => {
    return allDebtors.reduce((sum, b) => sum + (Number(b.debt) || 0), 0);
  }, [allDebtors]);

  const totalOverpaidSum = useMemo(() => {
    return allOverpaid.reduce((sum, b) => sum + (Number(b.overpaid) || 0), 0);
  }, [allOverpaid]);

  // Filter list by search query
  const q = searchQuery.trim().toLowerCase();
  const filteredList = useMemo(() => {
    const sourceList = activeTab === "debt" ? allDebtors : allOverpaid;
    if (!q) return sourceList;

    return sourceList.filter((b) => {
      const nameMatch = b.name?.toLowerCase().includes(q);
      const shopName = shopMap.get(b.barbershopId) || "";
      const shopMatch = shopName.toLowerCase().includes(q);
      const phoneMatch = b.phone?.includes(q);
      return nameMatch || shopMatch || phoneMatch;
    });
  }, [activeTab, allDebtors, allOverpaid, q, shopMap]);

  if (!isOpen) return null;

  const handleBarberClick = (barber) => {
    if (barber.barbershopId && barber.id) {
      onClose();
      navigate(`/sartaroshxonalar/${barber.barbershopId}/barber/${barber.id}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                activeTab === "debt" ? "bg-red-600" : "bg-emerald-600"
              }`}
            >
              {activeTab === "debt" ? <AlertCircle size={22} /> : <DollarSign size={22} />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {activeTab === "debt" ? "Qarzdorlar ro'yxati" : "Haqdorlar ro'yxati"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {activeTab === "debt" ? (
                  <span>
                    Jami <strong>{allDebtors.length}</strong> nafar qarzdor •{" "}
                    <strong className="text-red-700">
                      {totalDebtSum.toLocaleString()} {uz.common.sum}
                    </strong>
                  </span>
                ) : (
                  <span>
                    Jami <strong>{allOverpaid.length}</strong> nafar sartarosh •{" "}
                    <strong className="text-emerald-700">
                      {totalOverpaidSum.toLocaleString()} {uz.common.sum}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 shadow-2xs border border-slate-200/80 transition-all"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/40 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("debt")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "debt"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>Qarzdorlar</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "debt" ? "bg-red-700 text-white" : "bg-red-100 text-red-800"
              }`}
            >
              {allDebtors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("overpaid")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overpaid"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>Haqdorlar</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "overpaid"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {allOverpaid.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sartarosh yoki sartaroshxona nomi bo'yicha qidirish..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-8 py-2 text-xs text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100/0">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery
                  ? "Qidiruv bo'yicha sartarosh topilmadi"
                  : activeTab === "debt"
                  ? "Qarzdor sartaroshlar mavjud emas!"
                  : "Ortiqcha to'lov qilgan sartaroshlar mavjud emas!"}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchQuery
                  ? "Qidiruv so'zini o'zgartirib ko'ring"
                  : activeTab === "debt"
                  ? "Barcha sartaroshlarning hisobi toza va qarzlar to'langan."
                  : "Hozirda ortiqcha to'lov balansi mavjud emas."}
              </p>
            </div>
          ) : (
            filteredList.map((barber) => {
              const shopName = shopMap.get(barber.barbershopId) || "Sartaroshxona";
              const debtAmt = Number(barber.debt || 0);
              const overpaidAmt = Number(barber.overpaid || 0);
              const towelsCount = Number(
                barber.towelsCount !== undefined
                  ? barber.towelsCount
                  : barber.initialTowels || 0,
              );

              return (
                <div
                  key={barber.id}
                  onClick={() => handleBarberClick(barber)}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === "debt"
                      ? "bg-red-50/40 border-red-100 hover:bg-red-50/80 hover:border-red-200"
                      : "bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/80 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
                        activeTab === "debt" ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    >
                      <Scissors size={16} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-red-950">
                        {barber.name}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate flex-wrap">
                        <span className="flex items-center gap-1 truncate font-medium text-slate-600">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{shopName}</span>
                        </span>

                        {towelsCount > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-semibold text-slate-600">
                              {towelsCount} dona sochiqda
                            </span>
                          </>
                        )}
                      </div>

                      {barber.phone && (
                        <div
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={10} className="text-slate-400" />
                          <a
                            href={`tel:+998${barber.phone}`}
                            className="hover:underline"
                          >
                            +998 {formatPhoneDisplay(barber.phone)}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      {activeTab === "debt" ? (
                        <>
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                            Qarzi:
                          </p>
                          <p className="text-sm sm:text-base font-extrabold text-red-700">
                            {debtAmt.toLocaleString()} {uz.common.sum}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                            Ortiqcha:
                          </p>
                          <p className="text-sm sm:text-base font-extrabold text-emerald-800">
                            {overpaidAmt.toLocaleString()} {uz.common.sum}
                          </p>
                        </>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Ko'rsatilmoqda: <strong>{filteredList.length}</strong> ta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

