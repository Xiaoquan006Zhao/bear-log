import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
  centered?: boolean
}

export function LoadingIndicator({ size = "md", text, className, centered = false }: LoadingIndicatorProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("flex items-center", centered && "justify-center", className)}>
      <Loader2 className={cn(sizeMap[size], "animate-spin mr-2")} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  )
}

