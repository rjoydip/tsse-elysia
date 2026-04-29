/**
 * Shared SimpleBarList component.
 * Extracted from dashboard/components/analytics.tsx to reduce duplication.
 */

interface SimpleBarListProps {
  items: { name: string; value: number }[];
  valueFormatter: (n: number) => string;
  barClass: string;
}

/**
 * A simple horizontal bar chart for displaying labeled values.
 * Used in analytics dashboards for comparisons (e.g., traffic sources, devices).
 */
export function SimpleBarList({ items, valueFormatter, barClass }: SimpleBarListProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`;
        return (
          <li key={i.name} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 truncate text-xs text-muted-foreground">{i.name}</div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div className={`h-2.5 rounded-full ${barClass}`} style={{ width }} />
              </div>
            </div>
            <div className="ps-2 text-xs font-medium tabular-nums">{valueFormatter(i.value)}</div>
          </li>
        );
      })}
    </ul>
  );
}