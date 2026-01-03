/**
 * cn - Utility for conditionally constructing class strings.
 * Standard Tailwind CSS utility using clsx and tailwind-merge.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * @param inputs - Class values to merge (strings, arrays, objects).
 * @returns Merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
