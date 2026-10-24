import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Package,
  Receipt,
  Shield,
  User,
  Users,
} from "./icons";
import { ROLES } from "../constants/roles";
import { useHeaderContext } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import { InstallPwaButton } from "./InstallPwaButton";

export function AppLayout({ role, userProfile, _onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, subtitle, showBack, backTo, actions } = useHeaderContext();

  const isAdmin = role === ROLES.ADMIN;
  const isManager = role === ROLES.MANAGER;
  const isProfileActive = location.pathname === "/profile";
  const isWarehouseActive = location.pathname.startsWith("/ombor");

  // Bottom Nav active states
  const isBarbershopsActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/sartaroshxonalar");
  const isSalesActive = location.pathname.startsWith("/savdolar");
  const isStatsActive = location.pathname.startsWith("/statistika");
  const isStaffActive = location.pathname.startsWith("/xodimlar");

  // Detect dedicated full-screen action pages (e.g. NewSalePage) where bottom nav should be hidden
  // so bottom action buttons stay fixed at the bottom with no collision
  const isSaleActionPage =
    location.pathname.endsWith("/sale") ||
    location.pathname.includes("/yangi-savdo") ||
    location.pathname === "/savdolar/yangi";

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-slate-50 antialiased shadow-2xl">
      {/* Top Header: Present across inner screens containing current page title, action icons, and Profile button */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/90 bg-white/95 px-3.5 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
              title="Orqaga"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-300 text-slate-700">
              <img
                src="/favicon.svg"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight truncate">
              {title || uz.appName}
            </h1>
            {subtitle ? (
              <p className="text-[11px] text-slate-400 font-medium truncate leading-none mt-0.5">
                {subtitle}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                {uz.appName} PWA
              </p>
            )}
          </div>
        </div>

        {/* Right side: Action icons & Profile button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Custom Action icons for inner screens (e.g. Map icon, Settings gear icon) */}
          {actions}

          {/* Download / Install PWA icon */}
          <InstallPwaButton />

          {/* Profile Button */}
          <Link
            to="/profile"
            title={uz.nav.profile}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              isProfileActive
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isAdmin ? (
              <Shield
                size={14}
                className={isProfileActive ? "text-white" : "text-indigo-600"}
              />
            ) : isManager ? (
              <Package
                size={14}
                className={isProfileActive ? "text-white" : "text-purple-600"}
              />
            ) : (
              <User
                size={14}
                className={isProfileActive ? "text-white" : "text-emerald-600"}
              />
            )}
            <span className="max-w-[85px] truncate">
              {userProfile?.name?.split(" ")[0] ||
                (isAdmin
                  ? uz.roles.admin
                  : isManager
                    ? uz.roles.manager
                    : uz.roles.delivery)}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={
          isSaleActionPage ? "flex-1 px-3.5 py-4 pb-0" : "flex-1 px-3.5 py-4 pb-24"
        }
      >
        <Outlet />
      </main>

      {/* Persistent, mobile-optimized Bottom Navigation bar */}
      {/* Hidden during full-screen action pages so fixed bottom buttons have dedicated bottom placement */}
      {/* CRITICAL HINT: Hide Xodimlar tab completely if the logged-in user's role is staff! Visible ONLY to admin. */}
      {!isSaleActionPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-lg border-t border-slate-200/90 bg-white/95 px-2 py-2 backdrop-blur-md shadow-lg">
          {isManager ? (
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Ombor (Warehouse) */}
              <Link
                to="/ombor"
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                  isWarehouseActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                <Package size={20} />
                <span className="text-[10px] mt-1 leading-none tracking-tight">
                  {uz.nav.warehouse}
                </span>
              </Link>

              {/* 2. Profil */}
              <Link
                to="/profile"
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                  isProfileActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                <User size={20} />
                <span className="text-[10px] mt-1 leading-none tracking-tight">
                  {uz.nav.profile}
                </span>
              </Link>
            </div>
          ) : (
            <div
              className={`grid gap-1 ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}
            >
              {/* 1. Sartaroshxonalar (Barbershops) */}
              <Link
                to="/sartaroshxonalar"
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                  isBarbershopsActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                <Building2 size={20} />
                <span className="text-[10px] mt-1 leading-none tracking-tight">
                  {uz.nav.barbershops}
                </span>
              </Link>

              {/* 2. Savdolar (Sales / Transactions) */}
              <Link
                to="/savdolar"
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                  isSalesActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                <Receipt size={20} />
                <span className="text-[10px] mt-1 leading-none tracking-tight">
                  {uz.nav.sales}
                </span>
              </Link>

              {/* 3. Statistikalar (Stats / Driver Daily Report) */}
              <Link
                to="/statistika"
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                  isStatsActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                <BarChart3 size={20} />
                <span className="text-[10px] mt-1 leading-none tracking-tight">
                  {isAdmin ? uz.nav.stats : "Hisobot"}
                </span>
              </Link>

              {/* 4. Xodimlar (Staff) -> CRITICAL HINT: ONLY visible to admin, hidden for staff */}
              {isAdmin && (
                <Link
                  to="/xodimlar"
                  className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                    isStaffActive
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-slate-500 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Users size={20} />
                  <span className="text-[10px] mt-1 leading-none tracking-tight">
                    {uz.nav.staff}
                  </span>
                </Link>
              )}
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
