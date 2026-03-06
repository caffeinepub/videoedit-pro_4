import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

// Extend Window with the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "videro_pwa_banner_dismissed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true || window.matchMedia("(display-mode: standalone)").matches
  );
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false); // for CSS slide-in animation

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    // Don't show if already installed (standalone mode)
    if (isInStandaloneMode()) return;

    // iOS: no beforeinstallprompt, show manual instructions
    if (isIOS()) {
      setShowIOS(true);
      setShowBanner(true);
      // Slight delay to trigger slide-in animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        handleDismiss();
      }
    });
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setVisible(false);
    // Wait for slide-out animation before unmounting
    setTimeout(() => {
      setShowBanner(false);
      localStorage.setItem(DISMISS_KEY, "true");
    }, 300);
  }

  if (!showBanner) return null;

  return (
    <div
      data-ocid="pwa.panel"
      className={[
        "fixed bottom-0 left-0 right-0 z-50",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      role="banner"
      aria-label="Install Videro app"
    >
      {/* Backdrop blur strip */}
      <div className="mx-auto max-w-2xl px-3 pb-3">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.022 270 / 0.97), oklch(0.14 0.015 270 / 0.97))",
            border: "1px solid oklch(0.72 0.16 65 / 0.35)",
            boxShadow:
              "0 -2px 24px oklch(0.72 0.16 65 / 0.10), 0 4px 16px oklch(0 0 0 / 0.4)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Icon */}
          <img
            src="/assets/generated/videro-icon-192.dim_192x192.png"
            alt="Videro"
            className="w-10 h-10 rounded-xl shrink-0"
            style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.4)" }}
          />

          {/* Text */}
          <div className="flex-1 min-w-0">
            {showIOS ? (
              <>
                <p className="text-xs font-semibold text-foreground leading-snug font-display truncate">
                  Install Videro
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 flex items-center gap-1">
                  Tap <Share className="w-3 h-3 inline shrink-0 text-primary" />{" "}
                  then &ldquo;Add to Home Screen&rdquo;
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-foreground leading-snug font-display">
                  Install Videro
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Get the full app experience on your device
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!showIOS && (
              <button
                type="button"
                data-ocid="pwa.install_button"
                onClick={handleInstall}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.16 65), oklch(0.62 0.20 45))",
                  color: "oklch(0.10 0.005 260)",
                  boxShadow: "0 2px 8px oklch(0.72 0.16 65 / 0.35)",
                }}
                aria-label="Install Videro app"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            )}

            <button
              type="button"
              data-ocid="pwa.close_button"
              onClick={handleDismiss}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
