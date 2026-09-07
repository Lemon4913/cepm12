import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { AchievementWatcher } from "@/components/achievement/achievement-watcher";
import { getCurrentUser } from "@/lib/auth/dal";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ตลาดท่านา | Talat Tha Na",
  description:
    "เว็บแอปแผนที่ดิจิทัลและระบบสะสมตราประทับผ่านการสแกน QR Code สำหรับตลาดท่านา จ.นครปฐม",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e8983" },
    { media: "(prefers-color-scheme: dark)", color: "#16211f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="th"
      className={`${ibmPlexSansThai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {/* Below md: the original single mobile column with a bottom tab
              bar. At md+: a persistent sidebar replaces the bottom bar, and
              the column stops being pinned to a phone-width strip in the
              middle of the screen — individual pages opt into how much of
              the remaining width they use (see PageHeader's `wide` prop). */}
          <div className="flex min-h-dvh flex-col md:flex-row">
            <SidebarNav user={user} />
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20 sm:max-w-lg md:max-w-none md:pb-0">
              {children}
            </div>
          </div>
          <BottomNav />
          <Toaster position="top-center" />
          <OnboardingTour />
          <AchievementWatcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
