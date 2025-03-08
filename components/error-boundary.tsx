"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Caught in error boundary:", error)
      setError(error.error || new Error("Unknown error occurred"))
      setHasError(true)
    }

    window.addEventListener("error", errorHandler)
    return () => window.removeEventListener("error", errorHandler)
  }, [])

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {error?.message || "An unexpected error occurred while rendering this component."}
        </p>
        <Button onClick={() => setHasError(false)}>Try Again</Button>
      </div>
    )
  }

  return <>{children}</>
}

