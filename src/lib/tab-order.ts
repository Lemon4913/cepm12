/** Single source of truth for the bottom-nav tab order, shared by BottomNav and swipe navigation. */
export const TAB_PATHS = ["/", "/map", "/scan", "/others"] as const;
export type TabPath = (typeof TAB_PATHS)[number];
