import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface ChartSidebarGridProps {
  chartContent: React.ReactNode;
  sidebarItems: Array<{
    title: string;
    description?: string;
    content: React.ReactNode;
    lgColSpan?: number;
  }>;
}

/**
 * Shared grid layout for chart + sidebar sections
 * Used in both analytics and overview dashboard tabs
 */
export function ChartSidebarGrid({ chartContent, sidebarItems }: ChartSidebarGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      {/* Chart section */}
      <Card className="col-span-1 lg:col-span-4">
        <CardHeader>{chartContent}</CardHeader>
      </Card>

      {/* Sidebar sections */}
      {sidebarItems.map((item, index) => (
        <Card key={index} className={`col-span-1 lg:col-span-${item.lgColSpan ?? 3}`}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            {item.description && <CardDescription>{item.description}</CardDescription>}
          </CardHeader>
          <CardContent>{item.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}