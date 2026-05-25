/**
 * Dashboard API routes module.
 * Exports all dashboard-related API endpoints.
 */

import { metricsRoutes } from "./-metrics.ts";
import { analyticsRoutes } from "./-analytics.ts";
import { recentActivityRoutes } from "./-recent-activity.ts";
import { overviewChartRoutes } from "./-overview-chart.ts";

export { metricsRoutes, analyticsRoutes, recentActivityRoutes, overviewChartRoutes };