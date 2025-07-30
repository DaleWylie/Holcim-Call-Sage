import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScoreColor(score: number): string {
  if (score <= 1) {
    return "bg-red-500"; // Red for scores 0-1
  }
  if (score <= 3) {
    return "bg-amber-500"; // Amber for scores 2-3
  }
  return "bg-green-500"; // Green for scores 4-5
}
