import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import type { ReactNode } from "react";

/**
 * Configuration for a dashboard metric card.
 */
export interface DashboardCardConfig {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

/**
 * Props for the DashboardState component.
 */
export interface DashboardStateProps {
  variant: "loading" | "error";
  view: "basic" | "sales" | "team";
}

/**
 * Props for the DashboardMetricCard component.
 */
export interface DashboardMetricCardProps {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: ReactNode;
  headerStyle?: "basic" | "sales";
}

/**
 * Shared metric card component for dashboard views.
 * Supports two header styles: "basic" (pb-2, no flex-row) and "sales" (flex-row with space-between).
 */
export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon,
  headerStyle = "basic",
}: DashboardMetricCardProps) {
  return (
    <Card>
      <CardHeader
        className={
          headerStyle === "sales"
            ? "flex flex-row items-center justify-between space-y-0 pb-2"
            : "pb-2"
        }
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

/** Card configurations for the basic dashboard view */
const basicCards: DashboardCardConfig[] = [
  {
    title: "Your Activity",
    subtitle: "Tasks completed today",
    icon: null,
  },
  {
    title: "Pending Tasks",
    subtitle: "Tasks waiting for you",
    icon: null,
  },
];

/** Card configurations for the sales dashboard view */
const salesCards: DashboardCardConfig[] = [
  {
    title: "Today's Sales",
    subtitle: "+0% from yesterday",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M6 2h3M6 6h9a3.5 3.5 0 0 1 0 7H6M4 10h14M6 17h10" />
      </svg>
    ),
  },
  {
    title: "Transactions",
    subtitle: "Processed today",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    title: "Refunds",
    subtitle: "Processed today",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
  {
    title: "Active Now",
    subtitle: "Customers online",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

/** Card configurations for the team dashboard view */
const teamCards: DashboardCardConfig[] = [
  {
    title: "Team Performance",
    subtitle: "Team quota achieved",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Team Sales",
    subtitle: "+0% from last month",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M6 2h3M6 6h9a3.5 3.5 0 0 1 0 7H6M4 10h14M6 17h10" />
      </svg>
    ),
  },
  {
    title: "Tasks Completed",
    subtitle: "This week",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ),
  },
  {
    title: "Active Now",
    subtitle: "Team members online",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

/**
 * Returns the card configuration for a given view type.
 */
function getCardConfig(view: "basic" | "sales" | "team"): DashboardCardConfig[] {
  switch (view) {
    case "basic":
      return basicCards;
    case "sales":
      return salesCards;
    case "team":
      return teamCards;
  }
}

/**
 * Returns the grid column class for a given view type.
 */
function getGridClass(view: "basic" | "sales" | "team"): string {
  return view === "basic" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4";
}

/**
 * Shared dashboard state component that renders loading or error states
 * for basic, sales, and team dashboard views.
 */
export function DashboardState({ variant, view }: DashboardStateProps) {
  const cards = getCardConfig(view);
  const isError = variant === "error";

  return (
    <div className={`grid gap-4 ${getGridClass(view)}`}>
      {cards.map((card) => (
        <DashboardMetricCard
          key={card.title}
          title={card.title}
          value={
            isError ? (
              <div className="text-2xl font-bold text-destructive">--</div>
            ) : (
              <Skeleton className="h-9 w-20" />
            )
          }
          subtitle={card.subtitle}
          icon={card.icon}
          headerStyle={view === "basic" ? "basic" : "sales"}
        />
      ))}
    </div>
  );
}