"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Info, Map, QrCode, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAB_PATHS, type TabPath } from "@/lib/tab-order";
import { navigateWithDirection } from "@/lib/view-transition-navigate";

const NAV_ITEMS = [
  { href: "/", label: "ข้อมูลทั่วไป", icon: Info },
  { href: "/map", label: "แผนที่", icon: Map },
  { href: "/scan", label: "สแกน QR", icon: QrCode },
  { href: "/others", label: "อื่นๆ", icon: MoreHorizontal },
] satisfies { href: TabPath; label: string; icon: typeof Info }[];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>, href: TabPath) {
    // Let modified clicks (open in new tab, etc.) behave natively.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();

    const fromIndex = TAB_PATHS.indexOf(pathname as TabPath);
    const toIndex = TAB_PATHS.indexOf(href);
    const direction = fromIndex === -1 || toIndex >= fromIndex ? "forward" : "back";
    navigateWithDirection(router, href, direction);
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 sm:max-w-lg">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={(e) => handleClick(e, href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "fill-primary/10")} strokeWidth={active ? 2.5 : 2} />
                <span className={cn(active && "font-medium")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
