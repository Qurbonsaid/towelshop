import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Scissors,
  Settings,
} from "../components/icons";

import { BarberModal } from "../components/BarberModal";
import { BarbershopModal } from "../components/BarbershopModal";
import { CONTRACT_TYPES } from "../constants/models";
import { ROLES, isDeliveryRole } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  createBarber,
  deleteBarbershopCascade,
  updateBarbershop,
} from "../services/firestoreService";
import { formatPhoneDisplay } from "../utils/auth";

export function BarbershopDetailsPage({
  role,
  barbershops = [],
  barbers = [],
  _sales = [],
  _returns = [],
}) {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const isAdmin = role === ROLES.ADMIN;
  const canManage = isAdmin || isDeliveryRole(role);

  const [isEditShopModalOpen, setIsEditShopModalOpen] = useState(false);
  const [isAddBarberModalOpen, setIsAddBarberModalOpen] = useState(false);

  const currentShop = useMemo(() => {
    return barbershops.find((s) => s.id === shopId);
  }, [barbershops, shopId]);

  const shopBarbers = useMemo(() => {
    return barbers.filter((b) => b.barbershopId === shopId);
  }, [barbers, shopId]);

  const hasLocation = Boolean(
    currentShop?.latitude !== null &&
    currentShop?.latitude !== undefined &&
    !isNaN(currentShop?.latitude) &&
    currentShop?.longitude !== null &&
    currentShop?.longitude !== undefined &&
    !isNaN(currentShop?.longitude),
  );

  // Calculate towels held per barber
  const barberTowelsHeldMap = useMemo(() => {
    const map = {};
    shopBarbers.forEach((b) => {
      map[b.id] = Number(b.towelsCount !== undefined ? b.towelsCount : (b.initialTowels || 0));
    });
    return map;
  }, [shopBarbers]);

  // Open external navigation apps using coordinates
  const handleOpenNavigation = () => {
    if (!hasLocation || !currentShop) return;
    const lat = currentShop.latitude;
    const lng = currentShop.longitude;
    const name = currentShop.name;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
      setTimeout(() => {
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          "_blank",
        );
      }, 1500);
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        "_blank",
      );
    }
  };

  const handleUpdateShop = async (data) => {
    if (!shopId) return;
    await updateBarbershop(shopId, data);
  };

  const handleDeleteShop = async (id) => {
    await deleteBarbershopCascade(id);
    navigate("/sartaroshxonalar", { replace: true });
  };

  const handleCreateBarber = async (data) => {
    await createBarber({ ...data, barbershopId: shopId });
  };

  // Header configuration
  useHeader(
    {
      title: currentShop ? currentShop.name : uz.nav.barbershops,
      subtitle: currentShop?.address || null,
      showBack: true,
      backTo: "/sartaroshxonalar",
      actions: canManage ? (
        <div className="flex items-center gap-1.5">
          {/* Admin Gear Icon: ONLY shown if user is admin */}
          {canManage && (
            <button
              type="button"
              onClick={() => setIsEditShopModalOpen(true)}
              title={uz.barbershopDetails.editShop}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      ) : null,
    },
    [currentShop, hasLocation, isAdmin],
  );

  if (!currentShop) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-800">
          Sartaroshxona topilmadi
        </p>
        <button
          type="button"
          onClick={() => navigate("/sartaroshxonalar")}
          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
        >
          {uz.barbershopDetails.backToShops}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Barbershop Info Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {currentShop.name}
            </h2>
            {currentShop.address && (
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                {currentShop.address}
              </p>
            )}
            {currentShop.phone && (
              <a
                href={`tel:${currentShop.phone}`}
                className="text-xs font-mono font-medium text-emerald-600 mt-1 inline-flex items-center gap-1 hover:underline"
              >
                <Phone size={12} />
                +998 {formatPhoneDisplay(currentShop.phone)}
              </a>
            )}
          </div>

          {hasLocation && (
            <button
              type="button"
              onClick={handleOpenNavigation}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <Navigation size={14} />
              Xarita
            </button>
          )}
        </div>
      </div>

      {/* Barbers Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {uz.barbershopDetails.barbersTitle} ({shopBarbers.length})
          </h3>
          <p className="text-[11px] text-slate-500">
            Sartaroshni tanlab savdo yoki qaytarim qilish mumkin
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsAddBarberModalOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus size={14} />
            {uz.barbershopDetails.addBarber}
          </button>
        )}
      </div>

      {/* Barbers List */}
      <div className="space-y-2.5">
        {shopBarbers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <Scissors size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {uz.barbershopDetails.noBarbers}
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsAddBarberModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              >
                <Plus size={14} />
                {uz.barbershopDetails.addBarber}
              </button>
            )}
          </div>
        ) : (
          shopBarbers.map((barber) => {
            const heldTowels = Math.max(0, barberTowelsHeldMap[barber.id] || 0);
            const debt = Number(barber.debt) || 0;
            const overpaid = Number(barber.overpaid) || 0;

            return (
              <div
                key={barber.id}
                onClick={() =>
                  navigate(`/sartaroshxonalar/${shopId}/barber/${barber.id}`)
                }
                className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md active:scale-98"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm">
                      <Scissors size={18} />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {barber.name}
                      </h4>
                      {barber.phone && (
                        <p className="text-[11px] font-mono text-slate-500">
                          +998 {formatPhoneDisplay(barber.phone)}
                        </p>
                      )}
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            barber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {barber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                            ? "Ishlatilgan sochiqqa"
                            : "Olingan sochiqqa"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-300 group-hover:text-emerald-600 transition-colors mt-2">
                    <ChevronRight size={18} />
                  </div>
                </div>

                {/* Summary statistics: total towels held, current debt, overpaid balance */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-center">
                  <div className="rounded-lg bg-emerald-50/80 px-1.5 py-1">
                    <span className="block text-[10px] text-emerald-800 font-medium">
                      {uz.barbershopDetails.totalTowelsHeld}
                    </span>
                    <span className="text-xs font-bold text-emerald-950">
                      {heldTowels} dona
                    </span>
                  </div>

                  <div className="rounded-lg bg-red-50/80 px-1.5 py-1">
                    <span className="block text-[10px] text-red-700 font-medium">
                      {uz.barbershopDetails.currentDebt}
                    </span>
                    <span className="text-xs font-bold text-red-900 truncate block">
                      {debt > 0 ? `${debt.toLocaleString()} so'm` : "0"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-sky-50/80 px-1.5 py-1">
                    <span className="block text-[10px] text-sky-700 font-medium">
                      {uz.barbershopDetails.overpaid}
                    </span>
                    <span className="text-xs font-bold text-sky-900 truncate block">
                      {overpaid > 0 ? `${overpaid.toLocaleString()} so'm` : "0"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Edit Barbershop Modal (with Leaflet picker and strict cascade delete) */}
      {isEditShopModalOpen && (
        <BarbershopModal
          barbershop={currentShop}
          isAdmin={isAdmin}
          onSave={handleUpdateShop}
          onDelete={handleDeleteShop}
          onClose={() => setIsEditShopModalOpen(false)}
        />
      )}

      {/* Admin Add Barber Modal */}
      {isAddBarberModalOpen && (
        <BarberModal
          barbershops={barbershops}
          preselectedShopId={shopId}
          isAdmin={isAdmin}
          onSave={handleCreateBarber}
          onClose={() => setIsAddBarberModalOpen(false)}
        />
      )}
    </div>
  );
}
