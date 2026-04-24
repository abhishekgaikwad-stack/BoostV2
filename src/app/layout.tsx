import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import { LoginSuccessToast } from "@/components/auth/LoginSuccessToast";
import "./globals.css";

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
    icon: "https://boost-v2-images.s3.ap-south-1.amazonaws.com/boost-logo-icon.svg",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Suspense fallback={null}>
          <LoginSuccessToast />
        </Suspense>
      </body>
    </html>
  );
}
