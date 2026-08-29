import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

/**
 * Navigates to `href`, stamping the slide direction onto <html> first so
 * src/components/navigation/page-transition.tsx can play a lightweight CSS slide on the
 * incoming page. Deliberately does NOT use the View Transitions API — capturing a
 * full-page screenshot for document.startViewTransition() visibly stalls the main thread
 * on less powerful machines (reported as the page "freezing" before switching tabs).
 */
export function navigateWithDirection(router: Router, href: string, direction: "forward" | "back") {
  document.documentElement.dataset.navDirection = direction;
  router.push(href);
}
