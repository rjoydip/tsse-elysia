# Phase 15: Replace Fake Dashboard Analytics with Real User Data

## Goal

Replace all `Math.random()` mock data in dashboard analytics with real user data from the `users` table via `UserRepository`. The user management feature is already fully implemented — now wire the dashboard to show real user metrics instead of fake sales/revenue/analytics data.

## Scope

All dashboard API routes, the dashboard repository, dashboard UI components, hooks, and the dashboard service layer.

---

## File Changes

### Repository Layer

| File                                                 | Change                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/repositories/users.ts`                          | Add `countByStatus`, `countByRole`, `findRecent`, `getMonthlyRegistrations` |
| `src/repositories/dashboard/dashboard.repository.ts` | Replace all mock data with calls to `UserRepository`                        |

### Route Layer (API)

| File                                           | Change                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/routes/api/dashboard/-metrics.ts`         | Replace mock revenue/sales metrics with user metrics                                |
| `src/routes/api/dashboard/-analytics.ts`       | Replace mock clicks/visitors/bounce/session with user role/status/registration data |
| `src/routes/api/dashboard/-recent-activity.ts` | Replace mock names with real recent users                                           |
| `src/routes/api/dashboard/-overview-chart.ts`  | Replace mock monthly sales with monthly user registrations                          |

### UI Layer

| File                                                    | Change                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/features/dashboard/index.tsx`                      | Update 4 metric card labels, remove hardcoded values, fetch from API  |
| `src/features/dashboard/components/analytics.tsx`       | Update labels (Total Clicks → Total Users, etc.), map new data shapes |
| `src/features/dashboard/components/recent-sales.tsx`    | Rename semantically, show real users with role as amount              |
| `src/features/dashboard/components/shared/user-row.tsx` | Make `amount` optional                                                |
| `src/features/dashboard/components/overview.tsx`        | Chart now shows user registrations                                    |
| `src/features/dashboard/components/analytics-chart.tsx` | Chart now shows weekly user registrations                             |

### Hooks

| File                                   | Change                                  |
| -------------------------------------- | --------------------------------------- |
| `src/hooks/use-dashboard-metrics.ts`   | Update for new metric response shape    |
| `src/hooks/use-dashboard-analytics.ts` | Update for new analytics response shape |
| `src/hooks/use-dashboard-chart.ts`     | Update for new chart data shape         |
| `src/hooks/use-analytics-chart.ts`     | Update for new traffic data shape       |
| `src/hooks/use-recent-sales.ts`        | Update for new recent users shape       |

### Service Layer

| File                                          | Change                                            |
| --------------------------------------------- | ------------------------------------------------- |
| `src/services/dashboard/dashboard.service.ts` | Update method docs and response type expectations |

---

## New UserRepository Methods

```typescript
countByStatus(status: string): Promise<number>;
countByRole(role: string): Promise<number>;
findRecent(limit: number): Promise<(typeof users.$inferSelect)[]>;
getUsersGroupedByStatus(): Promise<{ name: string; value: number }[]>;
```

## Data Mapping

| Old Mock Field       | New Real Data Source                             |
| -------------------- | ------------------------------------------------ |
| `totalRevenue`       | `userRepository.count()` (renamed conceptually)  |
| `totalUsers`         | `userRepository.count()`                         |
| `activeNow`          | `userRepository.countByStatus("active")`         |
| `salesCount`         | Removed (no user relation)                       |
| `refundsCount`       | Removed                                          |
| `revenueGrowth`      | Removed                                          |
| `userGrowth`         | Calculate from current vs previous period        |
| `salesGrowth`        | Removed                                          |
| `totalClicks`        | Total users count                                |
| `uniqueVisitors`     | Active users count                               |
| `bounceRate`         | Suspended users count (as percentage)            |
| `avgSessionDuration` | Admin users count                                |
| `referrers`          | Users grouped by role                            |
| `devices`            | Users grouped by status                          |
| `trafficData`        | Weekly user registrations                        |
| `recentSales`        | Recent users                                     |
| `recentUsers`        | Recent active users                              |
| `monthlySales`       | Monthly user registrations                       |
| `yearlyComparison`   | Monthly user registrations (current vs previous) |