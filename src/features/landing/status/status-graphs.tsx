import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Cell,
} from "recharts";

const PRIMARY_COLOR = "#6366f1";

interface ServiceHistoryRecord {
  serviceName: string;
  status: "up" | "down" | "degraded";
  latencyMs: number | null;
  timestamp: string;
}

export function LatencyGraph({
  history,
  serviceName,
}: {
  history: ServiceHistoryRecord[];
  serviceName: string;
}) {
  const data = history
    .filter((h) => h.serviceName === serviceName)
    .slice(-20)
    .map((h) => ({
      ...h,
      latency: h.latencyMs ?? 0,
      time: new Date(h.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  if (data.length === 0) {
    return (
      <div className="h-48 w-full mt-4 flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.3} />
              <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
            }}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke={PRIMARY_COLOR}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLatency)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBars({
  history,
  serviceName,
}: {
  history: ServiceHistoryRecord[];
  serviceName: string;
}) {
  const data = history
    .filter((h) => h.serviceName === serviceName)
    .slice(-20)
    .map((h) => ({
      ...h,
      value: h.status === "up" ? 1 : 0,
    }));

  if (data.length === 0) {
    return (
      <div className="h-12 w-full mt-4 flex items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="h-12 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="value" radius={[2, 2, 2, 2]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value === 1 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}