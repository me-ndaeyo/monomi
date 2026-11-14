import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Caveat, Geist, Geist_Mono } from "next/font/google"

import Providers from "@/components/providers"
import "./globals.css"

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-bricolage" })
const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono" })
const caveat = Caveat({ subsets: ["latin"], weight: ["700"], variable: "--font-caveat" })

export const metadata: Metadata = {
  title: { template: "%s · monomi", default: "monomi: verified checks in the real world" },
  description:
    "Monomi lets AI agents pay people nearby to check things in the real world. The money is set aside before anyone moves.",
  icons: { icon: "/icon.svg" },
}

export const viewport: Viewport = { themeColor: "#0B0C0A", width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${caveat.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
