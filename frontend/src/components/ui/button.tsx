import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-md shadow-violet-500/25 hover:from-violet-400 hover:to-blue-500 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted hover:border-primary/50 hover:-translate-y-px active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:-translate-y-px active:translate-y-0",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/70",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/25 hover:border-destructive/40 hover:-translate-y-px active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
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

export { Button, buttonVariants }
