import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-naskh-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "خياطتي — سوق الخيّاطين في الكويت", template: "%s · خياطتي" },
  description: "انشري طلبك، قارني عروض الخيّاطين، وادفعي المقدّم بأمان عبر البوابة.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#651F37",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${naskh.variable}`}>
      <body>
        <StoreProvider>
          <div className="frame">{children}</div>
        </StoreProvider>
      </body>
    </html>
  );
}
