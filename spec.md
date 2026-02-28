# Specification

## Summary
**Goal:** Add four unique visitor counter cards to the Admin Dashboard, tracking authenticated visitors across daily, weekly, monthly, and all-time periods.

**Planned changes:**
- Add backend state to track unique authenticated visitors (by Principal ID) for four time periods: daily (resets each day), weekly (resets each Monday), monthly (resets each January 1), and all-time (never resets)
- Add a `recordVisit` backend function that increments the appropriate counters only once per Principal per period, ignoring anonymous callers
- Add a `getVisitorStats` backend query function that returns the four counts
- Add four new stat cards on the Admin Dashboard page below the existing "Active Accounts" and "Total Users" cards, labeled "Daily Visitors", "Weekly Visitors", "Monthly Visitors", and "All-Time Visitors", matching the existing dark rounded card style
- On Admin Dashboard page load, call `recordVisit` once with the authenticated user's Principal ID, then fetch and display all four counts via `getVisitorStats`

**User-visible outcome:** The Admin Dashboard at /admin displays four new visitor counter cards beneath the existing cards, showing how many unique authenticated users visited the platform today, this week, this month, and all time.
