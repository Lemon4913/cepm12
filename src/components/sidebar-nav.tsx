"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Info, Map, QrCode, MoreHorizontal, UserCircle, LogIn, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

const NAV_ITEMS = [
  { href: "/", label: "ข้อมูลทั่วไป", icon: Info },
  { href: "/map", label: "แผนที่", icon: Map },
  { href: "/scan", label: "สแกน QR", icon: QrCode },
  { href: "/others", label: "อื่นๆ", icon: MoreHorizontal },
] as const;

type SidebarUser = { name: string; email: string } | null;

/**
 * Desktop-only counterpart to <BottomNav> (which stays for mobile — see
 * layout.tsx, each hidden at the other's breakpoint). Vertical instead of a
 * 4-across bar, with room for a brand header and an account block that
 * mobile buries a tap deep inside the "Others" tab.
 */
export function SidebarNav({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight">{siteConfig.nameTh}</span>
          <span className="block truncate text-xs text-muted-foreground">{siteConfig.nameEn}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        {user ? (
          <Link
            href="/account"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
          >
            <UserCircle className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogIn className="size-5 shrink-0" />
            <span className="flex-1 font-medium">เข้าสู่ระบบ</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        )}
      </div>
    </aside>
  );
}
