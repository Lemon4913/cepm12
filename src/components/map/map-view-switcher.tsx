"use client";

import dynamic from "next/dynamic";
import { Globe, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketMap } from "@/components/map/market-map";
import type { StoreInfo } from "@/app/actions/stores";

// Leaflet reads `window` on import, so the real-world view can't be
// server-rendered — same treatment as the QR scanner on /scan.
const RealWorldMap = dynamic(() => import("@/components/map/real-world-map").then((m) => m.RealWorldMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[calc(100dvh-13rem)] w-full rounded-lg md:h-[calc(100dvh-11.5rem)]" />,
});

/**
 * Floor plan (interactive plots + admin editing) vs. the same plan overlaid on
 * OpenStreetMap. Floor plan stays the default; the real-world view is mainly
 * for people on site who want to see where they are relative to the market.
 */
export function MapViewSwitcher({
  svgMarkup,
  stores,
  isAdmin,
}: {
  svgMarkup: string;
  stores: Record<string, StoreInfo>;
  isAdmin: boolean;
}) {
  return (
    <Tabs defaultValue="plan" className="flex-1">
      <TabsList className="w-full md:w-fit">
        <TabsTrigger value="plan">
          <LayoutGrid />
          แผนผังตลาด
        </TabsTrigger>
        <TabsTrigger value="world">
          <Globe />
          แผนที่จริง
        </TabsTrigger>
      </TabsList>
      <TabsContent value="plan">
        <MarketMap svgMarkup={svgMarkup} stores={stores} isAdmin={isAdmin} />
      </TabsContent>
      <TabsContent value="world">
        <RealWorldMap svgMarkup={svgMarkup} />
      </TabsContent>
    </Tabs>
  );
}
