# Specification

## Summary
**Goal:** Fix the delete post and delete reply flows so that confirming the deletion dialog actually deletes the item on the backend and removes it from the UI.

**Planned changes:**
- Fix `VideoPostCard` delete handler to call the backend `deleteVideoPost` mutation, await the result, and only close the dialog on success.
- Fix `VideoReplyCard` delete handler to call the backend `deleteVideoReply` mutation, await the result, and only close the dialog on success.
- Audit `useDeleteVideoPost` and `useDeleteVideoReply` hooks in `useQueries.ts` to ensure they call the correct actor methods with the correct ID, and invalidate/remove the relevant query cache entries on success.
- Ensure backend errors surface as mutation errors instead of failing silently.

**User-visible outcome:** Clicking Delete in the confirmation dialog for a post or reply actually removes it from the backend and it immediately disappears from the UI. If deletion fails, the dialog stays open and the item remains visible.
