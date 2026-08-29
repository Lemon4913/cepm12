import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition;
};

let safetyNetInstalled = false;

/**
 * A slow/degraded environment can make the browser abort a view transition on its own
 * internal timeout, or a rapid double-navigation can hit its "already running" guard.
 * Neither indicates broken navigation (that already succeeded via router.push by then) —
 * it's purely the cosmetic slide animation not completing. Swallow only those two,
 * narrowly, rather than letting them surface as console noise.
 */
function installViewTransitionSafetyNet() {
  if (safetyNetInstalled || typeof window === "undefined") return;
  safetyNetInstalled = true;

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { name?: string } | undefined;
    if (reason?.name === "TimeoutError" || reason?.name === "InvalidStateError") {
      event.preventDefault();
    }
  });
}

/**
 * Navigates via the View Transitions API when available, tagging <html> with the slide
 * direction first so globals.css can animate accordingly. Falls back to a plain router.push
 * on unsupported browsers or when the visitor prefers reduced motion.
 */
export function navigateWithDirection(router: Router, href: string, direction: "forward" | "back") {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const doc = document as ViewTransitionDocument;

  if (prefersReducedMotion || typeof doc.startViewTransition !== "function") {
    router.push(href);
    return;
  }

  installViewTransitionSafetyNet();
  document.documentElement.dataset.navDirection = direction;

  try {
    const transition = doc.startViewTransition(() => {
      return new Promise<void>((resolve) => {
        router.push(href);
        // One frame is enough for React/Next to commit the new route before the
        // transition captures its "new" snapshot — holding this open longer only
        // raises the odds of hitting the browser's own timeout on a slow device.
        requestAnimationFrame(() => resolve());
      });
    });
    transition.updateCallbackDone.catch(() => {});
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
  } catch {
    router.push(href);
  }
}
