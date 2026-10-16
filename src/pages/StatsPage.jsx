import { useMemo } from "react";
import { AdminPushBanner } from "../components/AdminPushBanner";
import { AdminStatsCards } from "../components/AdminStatsCards";
import { Package } from "../components/icons";
import { useHeader } from "../context/HeaderContext";
import { ROLES } from "../constants/roles";
import { uz } from "../i18n/uz";

export function StatsPage({
  role,
  adminUser,
  sales = [],
  barbers = [],
  returns = [],
}) {
  const isAdmin = role === ROLES.ADMIN;

  useHeader(
    {
      title: uz.nav.stats,
      subtitle: "Moliyaviy va tovar hisobotlari",
      showBack: false,
    },
    [],
  );

  // Towels circulation calculations
  const circulation = useMemo(() => {
    let totalDelivered = 0;
    let totalReturned = 0;

    sales.forEach((s) => {
      totalDelivered += Number(s.quantityDelivered) || 0;
    });

    returns.forEach((r) => {
      totalReturned += Number(r.quantityReturned) || 0;
    });

    const heldByClients = Math.max(0, totalDelivered - totalReturned);

    return {
      totalDelivered,
      totalReturned,
      heldByClients,
    };
  }, [sales, returns]);

  return (
    <div className="space-y-4 pb-6">
      {/* If admin, show FCM Push Notification Banner */}
      {isAdmin && adminUser && <AdminPushBanner adminUser={adminUser} />}

      {/* Main Financial Stats Cards */}
      <AdminStatsCards sales={sales} barbers={barbers} />

      {/* Towel Circulation Balance Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Package size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sochiqlar aylanmasi balansi
            </h3>
            <p className="text-[11px] text-slate-500">
              Tizimdagi toza va ishlatilgan sochiqlar oqimi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
          <div className="rounded-xl bg-emerald-50/80 p-2.5 border border-emerald-100">
            <span className="block text-[10px] text-emerald-700 font-bold">
              Yetkazilgan
            </span>
            <span className="text-base font-extrabold text-emerald-950 block mt-0.5">
              {circulation.totalDelivered}
            </span>
            <span className="text-[10px] text-emerald-600">dona</span>
          </div>

          <div className="rounded-xl bg-sky-50/80 p-2.5 border border-sky-100">
            <span className="block text-[10px] text-sky-700 font-bold">
              Qaytarilgan
            </span>
            <span className="text-base font-extrabold text-sky-950 block mt-0.5">
              {circulation.totalReturned}
            </span>
            <span className="text-[10px] text-sky-600">dona</span>
          </div>

          <div className="rounded-xl bg-amber-50/80 p-2.5 border border-amber-100">
            <span className="block text-[10px] text-amber-800 font-bold">
              Band sochiq
            </span>
            <span className="text-base font-extrabold text-amber-950 block mt-0.5">
              {circulation.heldByClients}
            </span>
            <span className="text-[10px] text-amber-700">dona</span>
          </div>
        </div>
      </div>
    </div>
  );
}
