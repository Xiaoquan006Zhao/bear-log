import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { siteConfig } from "@/personalize/config"


// Import the toast provider
import { ToastProvider } from "@/components/ui/toast"
import { AppStateProvider } from "@/context/app-state-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
}

// Update the RootLayout component to include our providers
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-hidden`}>
        <AppStateProvider>
          {children}
          <ToastProvider />
        </AppStateProvider>
      </body>
    </html>
  )
}



import './globals.css'