let deferredPrompt = null;
let installed =
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true);

const subscribers = new Set();

const notify = () => {
  subscribers.forEach((subscriber) => subscriber({ deferredPrompt, installed }));
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

export function subscribeToPwaInstall(subscriber) {
  subscribers.add(subscriber);
  subscriber({ deferredPrompt, installed });
  return () => subscribers.delete(subscriber);
}

export function consumeDeferredPwaPrompt() {
  const prompt = deferredPrompt;
  deferredPrompt = null;
  notify();
  return prompt;
}
