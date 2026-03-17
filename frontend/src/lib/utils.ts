import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMutationError(error: unknown, fallback = "Request failed"): string {
  return error instanceof Error ? error.message : error ? fallback : ""
}
