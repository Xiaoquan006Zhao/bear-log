import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// Import the toast provider
import { ToastProvider } from "@/components/ui/toast"
import { AppStateProvider } from "@/context/app-state-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HTML Viewer",
  description: "View HTML files from the contents folder",
}

// Update the RootLayout component to include our providers
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add meta viewport for responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* You can add more static head content here if needed */}
      </head>
      <body className={`${inter.className} overflow-hidden`}>
        <AppStateProvider>
          {children}
          <ToastProvider />
        </AppStateProvider>
      </body>
    </html>
  )
}

