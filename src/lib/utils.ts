import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function now returns a full, static class name to prevent issues with
// Tailwind's Just-in-Time (JIT) compiler purging dynamic classes.
export function getScoreColor(score: number, maxScore: number = 100): string {
  const percentage = (score / maxScore) * 100;

  if (percentage < 40) { // Equivalent to < 2 on a 0-5 scale
    return 'bg-red-500';
  }
  if (percentage < 80) { // Equivalent to < 4 on a 0-5 scale
    return 'bg-amber-500';
  }
  return 'bg-green-500'; // Equivalent to 4 or 5
}
