import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Present";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function calculateCGPA(sgpas: number[]): number {
  if (!sgpas.length) return 0;
  const sum = sgpas.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / sgpas.length) * 100) / 100;
}

export function getCGPAColor(cgpa: number): string {
  if (cgpa >= 8.5) return "success";
  if (cgpa >= 7.0) return "info";
  if (cgpa >= 6.0) return "warning";
  return "danger";
}

export function formatExpType(type: string): string {
  const map: Record<string, string> = {
    INTERNSHIP: "Internship",
    VOLUNTEER: "Volunteer",
    CLUB: "Club Activity",
    OTHER: "Other",
  };
  return map[type] ?? type;
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}
