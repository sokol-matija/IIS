import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Glass primary — lavender gradient with glow */
        default:
          "bg-gradient-to-r from-[#a29bfe]/80 to-[#dfbaf4]/70 border-white/20 text-white shadow-[0_0_16px_rgba(162,155,254,0.35)] backdrop-blur-sm hover:from-[#a29bfe]/90 hover:to-[#dfbaf4]/85 hover:shadow-[0_0_24px_rgba(162,155,254,0.55)] hover:border-white/30 active:scale-[0.98]",
        /* Glass outline */
        outline:
          "bg-white/5 border-white/15 text-white/80 backdrop-blur-sm hover:bg-white/10 hover:border-white/25 hover:text-white active:bg-white/8",
        /* Glass secondary */
        secondary:
          "bg-white/8 border-white/10 text-white/75 backdrop-blur-sm hover:bg-white/14 hover:text-white active:bg-white/10",
        /* Ghost — minimal glass */
        ghost:
          "bg-transparent border-transparent text-white/50 hover:bg-white/8 hover:text-white/85 hover:border-white/10 active:bg-white/5",
        /* Destructive glass */
        destructive:
          "bg-red-500/15 border-red-500/25 text-red-300 backdrop-blur-sm hover:bg-red-500/25 hover:border-red-500/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] active:bg-red-500/30",
        link: "border-transparent text-violet-400 underline-offset-4 hover:underline hover:text-violet-300",
      },
      size: {
        default: "h-9 px-4",
        xs: "h-6 px-2 text-xs rounded-md",
        sm: "h-8 px-3 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
