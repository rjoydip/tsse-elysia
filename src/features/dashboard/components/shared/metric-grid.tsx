import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface MetricGridItem {
  title: string;
  value: string | number;
  change: string;
  changeLabel?: string; // Optional label for the change (e.g., "vs last week", "from last month")
  icon: React.ReactNode;
}

/**
 * Shared metric grid component for displaying 2x2 metric cards
 * Used in both analytics and overview dashboard tabs
 */
export function MetricGrid({ items }: { items: MetricGridItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.change} {item.changeLabel ?? ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}