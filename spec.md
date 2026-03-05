# Specification

## Summary
**Goal:** Fix the VideoPostCard so the entire card fits within the mobile viewport height without overflowing.

**Planned changes:**
- Constrain the VideoPostCard height to the available viewport height (100dvh minus sticky header height)
- Make the video element flex/shrink to fill remaining space within the card rather than overflow below the fold
- Ensure the header (avatar, username, date), title, video, and action buttons are all visible without scrolling within the card
- Verify layout works in both portrait and landscape mobile orientations

**User-visible outcome:** On mobile, users can see the complete video card — including header, title, video, and action buttons — fully within the screen, and can scroll through one complete card at a time.
