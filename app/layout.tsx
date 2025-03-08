import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// Import the toast provider
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HTML Viewer",
  description: "View HTML files from the contents folder",
    generator: 'v0.dev'
}

// Update the RootLayout component to include the toast provider
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-hidden`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}



import './globals.css'