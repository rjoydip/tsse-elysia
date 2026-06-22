/**
 * Shared password validation utilities and UI components.
 * Provides consistent password strength indicators and validation across the app.
 */

import { type ClassValue } from "cnfast";

interface PasswordRequirement {
  label: string;
  test: (pwd: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd) => /[0-9]/.test(pwd) },
];

export const PASSWORD_STRENGTH_LABELS: Record<number, string> = {
  0: "Weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

export function getPasswordStrength(pwd: string): number {
  return PASSWORD_REQUIREMENTS.filter((req) => req.test(pwd)).length;
}

export function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "bg-destructive";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-blue-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-muted";
  }
}

export function getStrengthLabel(score: number): string {
  return PASSWORD_STRENGTH_LABELS[score] ?? "";
}

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((x) => typeof x === "string")
    .join(" ");
}