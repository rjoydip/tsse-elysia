import { Shield, UserCheck, Users, CreditCard, User2 } from "lucide-react";
import { type UserStatus } from "./schema";

export const callTypes = new Map<UserStatus, string>([
  ["active", "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300"],
  ["inactive", "bg-muted text-muted-foreground"],
  ["invited", "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300"],
  ["suspended", "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"],
]);

export const roles = [
  {
    label: "Superadmin",
    value: "superadmin",
    icon: Shield,
  },
  {
    label: "Admin",
    value: "admin",
    icon: UserCheck,
  },
  {
    label: "Manager",
    value: "manager",
    icon: Users,
  },
  {
    label: "Cashier",
    value: "cashier",
    icon: CreditCard,
  },
  {
    label: "User",
    value: "user",
    icon: User2,
  },
] as const;