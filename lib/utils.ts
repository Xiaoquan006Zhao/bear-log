import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import path from "path";
export const CONTENTS_DIR = path.join(process.cwd(), "app/contents");

