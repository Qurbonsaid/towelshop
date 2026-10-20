import React, { useEffect, useState } from "react";
import { Download, Package, X } from "./icons";
import {
  consumeDeferredPwaPrompt,
  subscribeToPwaInstall,
} from "../utils/pwaInstall";

export function InstallPwaButton() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    return subscribeToPwaInstall(({ installed }) => {
      setIsInstalled(installed);
    });
  }, []);

  // If already installed, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const prompt = consumeDeferredPwaPrompt();
    if (prompt) {
      try {
        await prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult?.outcome === "accepted") {
          setIsInstalled(true);
        }
      } catch (err) {
        console.warn("PWA install prompt error:", err);
        setShowModal(true);
      }
    } else {
      // Show instructional modal if browser doesn't expose prompt programmatically (e.g., iOS Safari)
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Ilovani o'rnatish (PWA)"
        aria-label="Ilovani o'rnatish (PWA)"
        className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 active:scale-95 transition-all shadow-xs"
      >
        <Download size={17} />
        {/* Pulsing indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
        </span>
      </button>

      {/* Instructional guide modal for manual install (iOS, desktop or when beforeinstallprompt is handled manually) */}
      {showModal && (
        <div className="fixed inset-x-0 z-50 flex items-center justify-center bg-black/60 top-0 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Ilovani o'rnatish
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Towelshop PWA ilovasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-slate-600">
              <div className="rounded-xl bg-purple-50/80 p-3 border border-purple-200">
                <p className="font-bold text-purple-950 mb-1">
                  💻 Kompyuter (Chrome / Edge / Brave):
                </p>
                <p className="leading-snug">
                  Brauzer manzil qatori (URL) o'ng tomonidagi{" "}
                  <strong>"O'rnatish" (⬇️ yoki 🖥️)</strong> belgisini bosing yoki brauzer menyusidan (⋮){" "}
                  <strong>"Towelshop ilovasini o'rnatish"</strong> bandini tanlang.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200">
                <p className="font-bold text-emerald-950 mb-1">
                  📱 Android (Chrome / Samsung Internet):
                </p>
                <p className="leading-snug">
                  Brauzerning o'ng yuqori qismidagi{" "}
                  <strong>uch nuqta (⋮)</strong> tugmasini bosing va{" "}
                  <strong>"Ilovani o'rnatish"</strong> (yoki "Bosh ekranga
                  qo'shish") bandini tanlang.
                </p>
              </div>

              <div className="rounded-xl bg-sky-50/70 p-3 border border-sky-200">
                <p className="font-bold text-sky-950 mb-1">
                  🍎 iPhone / iPad (Safari):
                </p>
                <p className="leading-snug">
                  Brauzerning pastki qismidagi{" "}
                  <strong>"Ulashish" (Share)</strong> tugmasini bosing va
                  ro'yxatdan{" "}
                  <strong>"Bosh ekranga qo'shish" (Add to Home Screen)</strong>{" "}
                  ni tanlang.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
              >
                Tushundim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
