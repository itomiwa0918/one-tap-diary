import type { Metadata, Viewport } from "next"
import { Geist_Mono, Noto_Sans_JP } from "next/font/google"
import { SerwistProvider } from "@serwist/turbopack/react"

import "./globals.css"

const notoSansJP = Noto_Sans_JP({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  applicationName: "らくらく日記メーカー",
  title: "らくらく日記メーカー",
  description: "1タップで今日の行動を日記に残す",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "らくらく日記メーカー",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f0e6",
  interactiveWidget: "resizes-content",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh overflow-x-hidden overflow-y-auto bg-background font-sans text-foreground">
        <SerwistProvider
          swUrl="/sw.js"
          reloadOnOnline={false}
          cacheOnNavigation
          options={{ scope: "/" }}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  )
}
