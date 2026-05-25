# Dashboard Functional Implementation Plan

## Overview

Transform the current static dashboard into a functional dashboard that fetches real data from APIs and supports real-time updates.

## Current State Analysis

- Dashboard components use static/mock data (hardcoded arrays, random values, placeholders)
- Dashboard route fetches basic user count but components don't utilize it
- Existing dashboard service supports real-time updates but isn't connected to components
- API structure exists for users, auth, settings but lacks dashboard-specific endpoints

## Goals

1. Create API endpoints for dashboard data (sales, metrics, analytics, etc.)
2. Implement dashboard repository and service layers
3. Update dashboard components to fetch real data from APIs
4. Integrate real-time updates using existing dashboard service
5. Add proper error handling, loading states, and empty states

## Implementation Steps

### Phase 1: API Endpoints Creation

**Target**: `src/routes/api/dashboard/`

- Create dashboard API module with endpoints for:
  - Sales metrics (total revenue, transactions, refunds, active users)
  - User metrics (total users, growth, active now)
  - Analytics data (traffic overview, referrers, devices)
  - Recent sales/activity feed
  - Overview chart data

### Phase 2: Repository & Service Implementation

**Target**:

- Repository: `src/repositories/dashboard/dashboard.repository.ts`
- Service: `src/services/dashboard/dashboard.service.ts`

### Phase 3: Component Updates

Update these components to fetch real data:

- `src/features/dashboard/components/role-based-views.tsx` (all dashboard views)
- `src/features/dashboard/components/recent-sales.tsx`
- `src/features/dashboard/components/overview.tsx`
- `src/features/dashboard/components/analytics.tsx`
- `src/features/dashboard/components/analytics-chart.tsx`

### Phase 4: Real-time Integration

- Connect components to existing `dashboardService` for live updates
- Implement subscription/pubsub pattern for data changes
- Handle optimistic updates where appropriate

### Phase 5: Quality Assurance

- Add proper error handling and loading states
- Implement empty states for when no data is available
- Add retry mechanisms for failed requests
- Ensure proper TypeScript typing throughout

## Detailed Task List

### API Endpoints

- [ ] Create `src/routes/api/dashboard/index.ts` (module exports)
- [ ] Create `src/routes/api/dashboard/metrics.ts` (sales, user, revenue metrics)
- [ ] Create `src/routes/api/dashboard/analytics.ts` (traffic, referral data)
- [ ] Create `src/routes/api/dashboard/recent-activity.ts` (feed of recent actions)
- [ ] Create `src/routes/api/dashboard/overview-chart.ts` (chart data for overview)

### Repository Layer

- [ ] Create `src/repositories/dashboard/dashboard.repository.ts`
  - Methods for fetching sales data, user metrics, analytics data
  - Methods for recent activity feed
  - Methods for chart data

### Service Layer

- [ ] Create `src/services/dashboard/dashboard.service.ts`
  - Business logic for dashboard data processing
  - Data transformation and formatting
  - Caching strategies if needed

### Component Updates

#### Role-Based Views

- [ ] Update `BasicDashboard` to fetch real metrics
- [ ] Update `SalesDashboard` to fetch real sales data
- [ ] Update `TeamDashboard` to fetch real team/performance data
- [ ] Update `FullDashboard` to fetch all dashboard data

#### Specific Components

- [ ] Update `RecentSales` to fetch from API instead of hardcoded data
- [ ] Update `Overview` to fetch chart data from API
- [ ] Update `Analytics` to fetch real analytics metrics
- [ ] Update `AnalyticsChart` to use real chart data

### Real-time Integration

- [ ] Subscribe to dashboard updates in relevant components
- [ ] Implement optimistic updates for user interactions
- [ ] Handle connection status and reconnection logic

### Error Handling & States

- [ ] Add loading skeletons/spinners for data fetching
- [ ] Add error boundaries/retry mechanisms
- [ ] Add empty states when no data is available
- [ ] Add proper error logging and user feedback

## Dependencies

- Existing dashboard service (`src/services/dashboard/main.ts`)
- User and role repositories for authentication/authorization
- Settings service for user preferences
- Charting library (recharts) already in use

## Testing Strategy

- Unit tests for new repository and service methods
- Integration tests for API endpoints
- Component tests for data fetching and display
- E2E tests for dashboard functionality

## Files to Create/Modify

### New Files:

- `src/routes/api/dashboard/`
- `src/repositories/dashboard/dashboard.repository.ts`
- `src/services/dashboard/dashboard.service.ts`

### Modified Files:

- `src/features/dashboard/components/role-based-views.tsx`
- `src/features/dashboard/components/recent-sales.tsx`
- `src/features/dashboard/components/overview.tsx`
- `src/features/dashboard/components/analytics.tsx`
- `src/features/dashboard/components/analytics-chart.tsx`
- `src/routes/api/index.ts` (to include dashboard routes)

## Acceptance Criteria

- Dashboard displays real data from APIs instead of static/mock data
- Data updates in real-time when underlying data changes
- Proper loading states shown during data fetch
- Error states handled gracefully with user feedback
- All existing dashboard views (Basic, Sales, Team, Full) functional
- Responsive design maintained
- No regression in existing functionality

## Estimated Effort

- API Endpoints: 2-3 days
- Repository/Service: 1-2 days
- Component Updates: 3-4 days
- Real-time Integration: 1-2 days
- Testing & QA: 1-2 days