# Specification

## Summary
**Goal:** Redesign the main feed (HomePage) to display one video post card per full screen in a TikTok-style layout with scroll snapping.

**Planned changes:**
- Make each video post card in the main feed occupy exactly one full screen height (100dvh) below the header
- Enable vertical scroll snapping (`scroll-snap-type: y mandatory`) on the feed container so scrolling always lands on exactly one card at a time with no partial cards visible
- Ensure the header overlays the feed or is excluded from the card height calculation so the card fills the remaining viewport
- Fit all card content (video player, avatar, title, action buttons) within the single full-screen card without overflow

**User-visible outcome:** Users scrolling the home feed will see one video card at a time filling the entire screen, snapping cleanly between posts like TikTok — no partial cards visible, works on mobile viewports.
