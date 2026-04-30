import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AnalyticsChart } from "./analytics-chart";
import { SimpleBarList } from "~/components/shared/simple-bar-list";
import { MetricGrid } from "./shared/metric-grid";
import { ChartSidebarGrid } from "./shared/chart-sidebar-grid";

export function Analytics() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>Weekly clicks and unique visitors</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <AnalyticsChart />
        </CardContent>
      </Card>
      <MetricGrid
        items={[
          {
            title: "Total Clicks",
            value: 1248,
            change: "+12.4%",
            changeLabel: "vs last week",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M3 3v18h18" />
                <path d="M7 15l4-4 4 4 4-6" />
              </svg>
            ),
          },
          {
            title: "Unique Visitors",
            value: 832,
            change: "+5.8%",
            changeLabel: "vs last week",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <circle cx="12" cy="7" r="4" />
                <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
              </svg>
            ),
          },
          {
            title: "Bounce Rate",
            value: "42%",
            change: "-3.2%",
            changeLabel: "vs last week",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M3 12h6l3 6 3-6h6" />
              </svg>
            ),
          },
          {
            title: "Avg. Session",
            value: "3m 24s",
            change: "+18s",
            changeLabel: "vs last week",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            ),
          },
        ]}
      />
      <ChartSidebarGrid
        chartContent={
          <>
            <CardHeader>
              <CardTitle>Referrers</CardTitle>
              <CardDescription>Top sources driving traffic</CardDescription>
            </CardHeader>
          </>
        }
        sidebarItems={[
          {
            title: "Referrers",
            description: "Top sources driving traffic",
            content: (
              <SimpleBarList
                items={[
                  { name: "Direct", value: 512 },
                  { name: "Product Hunt", value: 238 },
                  { name: "Twitter", value: 174 },
                  { name: "Blog", value: 104 },
                ]}
                barClass="bg-primary"
                valueFormatter={(n) => `${n}`}
              />
            ),
            lgColSpan: 4,
          },
          {
            title: "Devices",
            description: "How users access your app",
            content: (
              <SimpleBarList
                items={[
                  { name: "Desktop", value: 74 },
                  { name: "Mobile", value: 22 },
                  { name: "Tablet", value: 4 },
                ]}
                barClass="bg-muted-foreground"
                valueFormatter={(n) => `${n}%`}
              />
            ),
            lgColSpan: 3,
          },
          {
            title: "Devices",
            description: "How users access your app",
            content: (
              <SimpleBarList
                items={[
                  { name: "Desktop", value: 74 },
                  { name: "Mobile", value: 22 },
                  { name: "Tablet", value: 4 },
                ]}
                barClass="bg-muted-foreground"
                valueFormatter={(n) => `${n}%`}
              />
            ),
            lgColSpan: 3,
          },
        ]}
      />
    </div>
  );
}