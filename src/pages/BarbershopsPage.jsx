import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  MapPin,
  Plus,
  Search,
} from "../components/icons";
import { BarbershopModal } from "../components/BarbershopModal";
import { ROLES } from "../constants/roles";

import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import { createBarbershop } from "../services/firestoreService";

export function BarbershopsPage({
  role,
  barbershops = [],
  barbers = [],
  _sales = [],
  _returns = [],
}) {
  const isAdmin = role === ROLES.ADMIN;
  const canManage = isAdmin || role === ROLES.STAFF;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Configure header
  useHeader(
    {
      title: uz.nav.barbershops,
      subtitle: `${barbershops.length} ta sartaroshxona`,
      showBack: false,
    },
    [barbershops.length, isAdmin],
  );

  // Compute stats per barbershop
  const shopStatsMap = useMemo(() => {
    const map = {};
    barbershops.forEach((shop) => {
      map[shop.id] = {
        barberCount: 0,
        totalDebt: 0,
        totalOverpaid: 0,
        heldTowels: 0,
      };
    });

    barbers.forEach((barber) => {
      if (map[barber.barbershopId]) {
        map[barber.barbershopId].barberCount += 1;
        map[barber.barbershopId].totalDebt += Number(barber.debt) || 0;
        map[barber.barbershopId].totalOverpaid += Number(barber.overpaid) || 0;
        map[barber.barbershopId].heldTowels += Number(
          barber.towelsCount !== undefined ? barber.towelsCount : (barber.initialTowels || 0)
        );
      }
    });

    return map;
  }, [barbershops, barbers]);

  // Filter barbershops by name in real-time
  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return barbershops;
    return barbershops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(q) ||
        (shop.address && shop.address.toLowerCase().includes(q)),
    );
  }, [barbershops, searchQuery]);

  const handleCreateShop = async (data) => {
    await createBarbershop(data);
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Real-time search input at the very top of Barbershop list */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sartaroshxona nomi bo'yicha qidirish..."
          className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-slate-400 hover:text-slate-600"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Admin Add Barbershop Quick Button */}
      {canManage && (
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100/60 active:scale-98 transition-all"
        >
          <Plus size={16} />
          {uz.admin.barbershops.addBtn}
        </button>
      )}

      {/* Barbershop list */}
      <div className="space-y-2.5">
        {filteredShops.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Building2 size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {searchQuery
                ? "Qidiruv bo'yicha sartaroshxona topilmadi"
                : "Hozircha sartaroshxonalar mavjud emas"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? "Boshqa nom bilan qidirib ko'ring"
                : isAdmin
                  ? "Yangi sartaroshxona qo'shish uchun yuqoridagi tugmani bosing"
                  : ""}
            </p>
          </div>
        ) : (
          filteredShops.map((shop) => {
            const stats = shopStatsMap[shop.id] || {
              barberCount: 0,
              totalDebt: 0,
              totalOverpaid: 0,
              heldTowels: 0,
            };
            const hasLocation = Boolean(
              shop.latitude !== null &&
              shop.latitude !== undefined &&
              shop.longitude !== null &&
              shop.longitude !== undefined,
            );

            return (
              <div
                key={shop.id}
                onClick={() => navigate(`/sartaroshxonalar/${shop.id}`)}
                className="group relative cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md active:scale-98"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Building2 size={22} />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {shop.name}
                        </h3>
                        {hasLocation ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            <MapPin size={10} />
                          </span>
                        ) : null}
                      </div>

                      {shop.address && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {shop.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-slate-300 group-hover:text-emerald-600 transition-colors mt-2">
                    <ChevronRight size={20} />
                  </div>
                </div>

                {/* Summary badges */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-center">
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Sartaroshlar
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {stats.barberCount} ta
                    </span>
                  </div>

                  <div className="rounded-lg bg-emerald-50/70 px-2 py-1.5">
                    <span className="block text-[10px] text-emerald-700 font-medium">
                      Band sochiq
                    </span>
                    <span className="text-xs font-bold text-emerald-900">
                      {Math.max(0, stats.heldTowels)} dona
                    </span>
                  </div>

                  <div className="rounded-lg bg-red-50/70 px-2 py-1.5">
                    <span className="block text-[10px] text-red-600 font-medium">
                      Qarz
                    </span>
                    <span className="text-xs font-bold text-red-800 truncate block">
                      {stats.totalDebt > 0
                        ? `${stats.totalDebt.toLocaleString()}`
                        : "0"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Add Barbershop Modal */}
      {isAddModalOpen && (
        <BarbershopModal
          isAdmin={isAdmin}
          onSave={handleCreateShop}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
