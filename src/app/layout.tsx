import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import { LoginSuccessToast } from "@/components/auth/LoginSuccessToast";
import { assetUrl } from "@/lib/images";
import "./globals.css";

// Resolved once at module init so the preconnect host stays in sync with
// whatever NEXT_PUBLIC_S3_PUBLIC_URL points at. Matches the resolution in
// src/lib/images.ts.
const CDN_ORIGIN = (() => {
  try {
    return new URL(assetUrl("")).origin;
  } catch {
    return null;
  }
})();

const gintoNord = localFont({
  src: "./fonts/ABCGintoNordWidthsVariable-Trial-BF651b7b7caffd5.ttf",
  variable: "--font-ginto",
  display: "swap",
  weight: "100 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boost",
  description: "Game account marketplace",
  icons: {
    icon: assetUrl("boost-logo-icon.svg"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gintoNord.variable} ${inter.variable} ${dmMono.variable} h-full antialiased`}
    >
      {CDN_ORIGIN ? (
        <>
          <link rel="preconnect" href={CDN_ORIGIN} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={CDN_ORIGIN} />
        </>
      ) : null}
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Suspense fallback={null}>
          <LoginSuccessToast />
        </Suspense>
      </body>
    </html>
  );
}
