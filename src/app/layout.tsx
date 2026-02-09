import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth QR - Turn Google Reviews into Revenue",
  description:
    "More stars. More visibility. More growth. Growth QR turns Google reviews into real revenue for your business",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  }, 
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { LegacyCleanup } from "@/components/LegacyCleanup";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/ClashGrotesk-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ClashGrotesk-Semibold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LegacyCleanup />
        {children}
      </body>
    </html>
  );
}
