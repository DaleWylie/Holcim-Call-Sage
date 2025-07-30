import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function now returns a full, static class name to prevent issues with
// Tailwind's Just-in-Time (JIT) compiler purging dynamic classes.
export function getScoreColor(score: number): string {
  const roundedScore = Math.round(score);
  if (roundedScore <= 1) {
    return 'bg-red-500'; // Red for scores 0-1
  }
  if (roundedScore <= 3) {
    return 'bg-amber-500'; // Amber for scores 2-3
  }
  return 'bg-green-500'; // Green for scores 4-5
}
