import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function now returns a full, static class name to prevent issues with
// Tailwind's Just-in-Time (JIT) compiler purging dynamic classes.
export function getScoreColor(score: number): string {
  if (score < 2) {
    return 'bg-red-500'; // Red for scores below 2
  }
  if (score < 4) {
    return 'bg-amber-500'; // Amber for scores from 2 up to 3.99...
  }
  return 'bg-green-500'; // Green for scores 4 and 5
}
