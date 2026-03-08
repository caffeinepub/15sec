# 15sec

## Current State

The app is a short-video social media platform. The header (`Header.tsx`) contains: branding (15sec), and a nav row with Home, Create, Notifications, optional Admin shield (for admin principal), and Account buttons.

The admin dashboard (`AdminDashboardPage.tsx`) shows Active Accounts, Total Users, and Unique Visitor stats cards, plus a User Accounts table.

The backend (`main.mo`) manages video posts, replies, user profiles, notifications, follow data, and visitor stats. There is no donate text storage.

## Requested Changes (Diff)

### Add
- A heart icon button in the header nav, positioned immediately to the left of the Home button
- Clicking the heart button opens a modal/dialog popup showing the current donate text
- Backend: `getDonateText() : async Text` — public query, returns current donate text (no auth required, visible to all logged-in users)
- Backend: `setDonateText(text: Text) : async ()` — admin-only update function
- Frontend hooks: `useGetDonateText` (query) and `useSetDonateText` (mutation)
- Admin Dashboard: a "Donate Popup Text" section below the existing stats/user table, with a textarea pre-filled with the current donate text and a Save button

### Modify
- `Header.tsx`: add Heart icon button before the Home button in the nav
- `AdminDashboardPage.tsx`: add "Donate Popup Text" card/section at the bottom
- `main.mo`: add `donateText` stable variable and two functions (`getDonateText`, `setDonateText`)
- `useQueries.ts`: add `useGetDonateText` and `useSetDonateText` hooks

### Remove
- Nothing removed

## Implementation Plan

1. Add `var donateText : Text` stable variable to `main.mo` with a default string
2. Add `getDonateText()` public query (no auth check, accessible to all) to `main.mo`
3. Add `setDonateText(text)` admin-only update function to `main.mo`
4. Add `useGetDonateText` query hook and `useSetDonateText` mutation hook to `useQueries.ts`
5. Add `Heart` icon button in `Header.tsx` nav, before the Home button, with a Dialog popup showing donate text
6. Add "Donate Popup Text" section to `AdminDashboardPage.tsx` with textarea + save button
