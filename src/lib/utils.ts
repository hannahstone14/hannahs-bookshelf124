
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Moves an item from one index to another in an array
 */
export function move<T>(array: T[], from: number, to: number): T[] {
  const copy = [...array];
  const item = copy[from];
  copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
