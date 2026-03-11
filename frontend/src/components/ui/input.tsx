import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Glass input base
        "flex h-10 w-full min-w-0 rounded-lg border px-3 py-1 text-base outline-none transition-all duration-200",
        "text-white/90 placeholder:text-white/30",
        // Glass surface
        "bg-white/6 border-white/12 backdrop-blur-sm",
        // Shadows and text
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        // Focus: glow ring
        "focus-visible:bg-white/9 focus-visible:border-violet-400/50 focus-visible:ring-3 focus-visible:ring-violet-400/20 focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]",
        // File input
        "file:text-white/80 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        // Invalid
        "aria-invalid:border-red-400/40 aria-invalid:ring-red-400/20",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
