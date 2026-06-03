/**
 * Dashboard overview cards showing roles and permissions counts.
 * Displays summary statistics from the dashboard metrics endpoint.
 */

import { useEffect, useState } from "react";
import { Shield, Key, ShieldCheck, Swords } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AnimatedNumber } from "~/features/dashboard/components/shared/animated-number";

/**
 * Metrics shape from the dashboard API.
 */
interface RolesMetrics {
  totalRoles: number;
  totalPermissions: number;
}

/**
 * Overview cards component for roles and permissions dashboard.
 */
export function RolesOverviewCards() {
  const [metrics, setMetrics] = useState<RolesMetrics>({
    totalRoles: 0,
    totalPermissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/dashboard/metrics", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalRoles: data.totalRoles ?? 0,
            totalPermissions: data.totalPermissions ?? 0,
          });
        }
      } catch {
        console.error("Failed to fetch roles metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const cards = [
    {
      title: "Total Roles",
      value: metrics.totalRoles,
      icon: Shield,
      description: "Custom roles defined in the system",
    },
    {
      title: "Total Permissions",
      value: metrics.totalPermissions,
      icon: Key,
      description: "Individual permissions available",
    },
    {
      title: "Role-Permission Mappings",
      value: metrics.totalRoles * metrics.totalPermissions || 0,
      icon: ShieldCheck,
      description: "Combined role-permission assignments",
    },
    {
      title: "Access Control",
      value: "RBAC",
      icon: Swords,
      description: "Role-based access control active",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof card.value === "number" ? (
                  <AnimatedNumber value={card.value} animation="bounce" enterDelay={idx * 100} />
                ) : (
                  card.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}