# 15sec

## Current State

A social media platform supporting 15-second video posts and 5-second video replies. Features include: user profiles with avatars, video likes/shares/replies, follow system, notifications, admin dashboard at /admin with user management and visitor stats. Header contains: 15sec branding, Home, Create, Notifications, Admin (conditional), Account buttons.

## Requested Changes (Diff)

### Add
- Donate heart icon button in header, positioned to the left of the Home button
- Donate popup modal that opens when the heart icon is clicked, showing admin-editable text
- Backend: `getDonateText()` query and `setDonateText(text: Text)` update function (admin-only write)
- Frontend: `useGetDonateText` query hook and `useSetDonateText` mutation hook
- Admin dashboard `/admin`: donate text editor section with a textarea and save button

### Modify
- Header component: insert Heart icon button before the Home button

### Remove
- Nothing

## Implementation Plan

1. **Backend (main.mo)**:
   - Add `var donateText : Text` stable variable with default text: "Support 15sec! Every contribution helps us keep the platform running and growing. Thank you for being part of our community."
   - Add `getDonateText()` public query (no auth required, anyone can read)
   - Add `setDonateText(text: Text)` public shared function (admin-only)

2. **Frontend hooks (useQueries.ts)**:
   - Add `useGetDonateText()` query hook calling `actor.getDonateText()`
   - Add `useSetDonateText()` mutation hook calling `actor.setDonateText(text)`

3. **Header component (Header.tsx)**:
   - Import `Heart` from lucide-react
   - Add Heart icon Button before the Home Button, with `onClick` opening a donate modal state
   - Render a donate popup/dialog when state is true

4. **DonateModal component** (new file or inline in Header):
   - Fetches donate text via `useGetDonateText()`
   - Displays text in a styled dialog/modal
   - Has a close button

5. **AdminDashboardPage.tsx**:
   - Add "Donate Text" section with a textarea pre-filled with current donate text
   - Save button calls `useSetDonateText` mutation
   - Show success/error toast on save
