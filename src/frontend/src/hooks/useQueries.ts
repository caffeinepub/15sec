import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Notification,
  UserProfile,
  VideoPost,
  VideoReply,
  VisitorStats,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Hardcoded permanent admin principal
const PERMANENT_ADMIN_PRINCIPAL =
  "a7dxs-nk6zm-shch4-6mlx5-xd7vi-bqjwf-euhqd-d47mb-mtbhj-4o34v-2qe";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useCheckUsernameAvailability() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.checkUsernameAvailability(username);
    },
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const callerPrincipal = identity?.getPrincipal().toString();
  const isPermanentAdmin = callerPrincipal === PERMANENT_ADMIN_PRINCIPAL;

  const query = useQuery<boolean>({
    queryKey: ["isCallerAdmin", callerPrincipal],
    queryFn: async () => {
      if (callerPrincipal === PERMANENT_ADMIN_PRINCIPAL) return true;
      if (!actor || !identity) return false;
      try {
        const principal = identity.getPrincipal();
        return await actor.isAdmin(principal);
      } catch {
        return false;
      }
    },
    enabled: !!identity,
    staleTime: 0,
  });

  if (isPermanentAdmin) {
    return {
      ...query,
      data: true,
      isLoading: false,
      isFetched: true,
    };
  }

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
  };
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllDeletionTimestamps();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetActiveAccountsCount() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["activeAccountsCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getActiveAccountsCount();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function usePromoteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.promoteUser(Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useDemoteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.demoteUser(Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function usePermanentlyDeleteAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.permanentlyDeleteAccount(Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["activeAccountsCount"] });
    },
  });
}

// ─── Visitor Stats ────────────────────────────────────────────────────────────

export function useGetVisitorStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VisitorStats>({
    queryKey: ["visitorStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getVisitorStats();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRecordVisit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordVisit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitorStats"] });
    },
  });
}

// ─── Video Posts ─────────────────────────────────────────────────────────────

export function useGetAllVideoPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoPost[]>({
    queryKey: ["videoPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideoPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetVideoPostById(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoPost | null>({
    queryKey: ["videoPost", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getVideoPostById(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

export function useGetVideoPostsByUser(userPrincipal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoPost[]>({
    queryKey: ["videoPostsByUser", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return actor.getVideoPostsByUser(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useGetVideoRepliesByUser(userPrincipal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoReply[]>({
    queryKey: ["videoRepliesByUser", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return actor.getVideoRepliesByUser(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useCreateVideoPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, video }: { title: string; video: any }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createVideoPost(title, video);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoPosts"] });
    },
  });
}

export function useDeleteVideoPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteVideoPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoPosts"] });
      queryClient.invalidateQueries({ queryKey: ["videoPostsByUser"] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoPosts"] });
      queryClient.invalidateQueries({ queryKey: ["videoPost"] });
    },
  });
}

export function useSharePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sharePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoPosts"] });
      queryClient.invalidateQueries({ queryKey: ["videoPost"] });
    },
  });
}

// ─── Video Replies ────────────────────────────────────────────────────────────

export function useGetRepliesForPost(videoId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoReply[]>({
    queryKey: ["videoReplies", videoId?.toString()],
    queryFn: async () => {
      if (!actor || videoId === null) return [];
      return actor.getRepliesForPost(videoId);
    },
    enabled: !!actor && !actorFetching && videoId !== null,
  });
}

export function useGetRepliesForPostWithPagination(
  videoId: bigint | null,
  startIndex: bigint,
  batchSize: bigint,
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoReply[]>({
    queryKey: [
      "videoRepliesPaginated",
      videoId?.toString(),
      startIndex.toString(),
      batchSize.toString(),
    ],
    queryFn: async () => {
      if (!actor || videoId === null) return [];
      return actor.getRepliesForPostWithPagination(
        videoId,
        startIndex,
        batchSize,
      );
    },
    enabled: !!actor && !actorFetching && videoId !== null,
  });
}

export function useGetRepliesCountForPost(videoId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["repliesCount", videoId?.toString()],
    queryFn: async () => {
      if (!actor || videoId === null) return BigInt(0);
      return actor.getRepliesCountForPost(videoId);
    },
    enabled: !!actor && !actorFetching && videoId !== null,
  });
}

export function useCreateVideoReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentVideoId,
      video,
    }: { parentVideoId: bigint; video: any }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createVideoReply(parentVideoId, video);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["videoReplies", variables.parentVideoId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["videoRepliesPaginated", variables.parentVideoId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["repliesCount", variables.parentVideoId.toString()],
      });
    },
  });
}

export function useDeleteVideoReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (replyId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteVideoReply(replyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoReplies"] });
      queryClient.invalidateQueries({ queryKey: ["videoRepliesPaginated"] });
      queryClient.invalidateQueries({ queryKey: ["repliesCount"] });
      queryClient.invalidateQueries({ queryKey: ["videoRepliesByUser"] });
    },
  });
}

export function useGetReplyLikesCount(replyId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["replyLikesCount", replyId?.toString()],
    queryFn: async () => {
      if (!actor || replyId === null) return BigInt(0);
      return actor.getReplyLikesCount(replyId);
    },
    enabled: !!actor && !actorFetching && replyId !== null,
  });
}

export function useHasUserLikedReply(replyId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["hasLikedReply", replyId?.toString()],
    queryFn: async () => {
      if (!actor || replyId === null) return false;
      return actor.hasUserLikedReplyForCaller(replyId);
    },
    enabled: !!actor && !actorFetching && replyId !== null,
  });
}

export function useHasUserLikedReplyForCaller(replyId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["hasLikedReply", replyId?.toString()],
    queryFn: async () => {
      if (!actor || replyId === null) return false;
      return actor.hasUserLikedReplyForCaller(replyId);
    },
    enabled: !!actor && !actorFetching && replyId !== null,
  });
}

export function useLikeReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (replyId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.likeReply(replyId);
    },
    onSuccess: (_data, replyId) => {
      queryClient.invalidateQueries({
        queryKey: ["replyLikesCount", replyId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["hasLikedReply", replyId.toString()],
      });
    },
  });
}

export function useUnlikeReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (replyId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unlikeReply(replyId);
    },
    onSuccess: (_data, replyId) => {
      queryClient.invalidateQueries({
        queryKey: ["replyLikesCount", replyId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["hasLikedReply", replyId.toString()],
      });
    },
  });
}

export function useShareReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (replyId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.shareReply(replyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoReplies"] });
    },
  });
}

export function useGetReplySharesCount(replyId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["replySharesCount", replyId?.toString()],
    queryFn: async () => {
      if (!actor || replyId === null) return BigInt(0);
      return actor.getReplySharesCount(replyId);
    },
    enabled: !!actor && !actorFetching && replyId !== null,
  });
}

export function useGetVideoReplyById(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoReply | null>({
    queryKey: ["videoReply", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getVideoReplyById(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetUnreadNotificationsCount() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["unreadNotificationsCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadNotificationsCount();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useMarkNotificationsAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationsAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
    },
  });
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export function useIsFollowing(targetPrincipal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isFollowing", targetPrincipal],
    queryFn: async () => {
      if (!actor || !targetPrincipal) return false;
      return actor.isFollowing(Principal.fromText(targetPrincipal));
    },
    enabled: !!actor && !actorFetching && !!targetPrincipal,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.followUser(Principal.fromText(targetPrincipal));
    },
    onSuccess: (_data, targetPrincipal) => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", targetPrincipal],
      });
      queryClient.invalidateQueries({ queryKey: ["followersCount"] });
      queryClient.invalidateQueries({ queryKey: ["followingCount"] });
      queryClient.invalidateQueries({
        queryKey: ["followersAndFollowingCounts"],
      });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfollowUser(Principal.fromText(targetPrincipal));
    },
    onSuccess: (_data, targetPrincipal) => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", targetPrincipal],
      });
      queryClient.invalidateQueries({ queryKey: ["followersCount"] });
      queryClient.invalidateQueries({ queryKey: ["followingCount"] });
      queryClient.invalidateQueries({
        queryKey: ["followersAndFollowingCounts"],
      });
    },
  });
}

export function useGetFollowersCount(userPrincipal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["followersCount", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return BigInt(0);
      return actor.getFollowersCount(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useGetFollowingCount(userPrincipal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["followingCount", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return BigInt(0);
      return actor.getFollowingCount(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useGetFollowersAndFollowingCounts(
  userPrincipal: string | null,
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[bigint, bigint]>({
    queryKey: ["followersAndFollowingCounts", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal)
        return [BigInt(0), BigInt(0)] as [bigint, bigint];
      return actor.getFollowersAndFollowingCounts(
        Principal.fromText(userPrincipal),
      );
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

// ─── Account Deletion ─────────────────────────────────────────────────────────

export function useDeleteAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAccount();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({
        queryKey: ["accountDeletionTimeRemaining"],
      });
    },
  });
}

export function useCancelAccountDeletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.cancelAccountDeletion();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({
        queryKey: ["accountDeletionTimeRemaining"],
      });
    },
  });
}

export function useGetAccountDeletionTimeRemaining() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ["accountDeletionTimeRemaining"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAccountDeletionTimeRemaining();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetUserAccountDeletionTimeRemaining(
  userPrincipal: string | null,
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ["userAccountDeletionTimeRemaining", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserAccountDeletionTimeRemaining(
        Principal.fromText(userPrincipal),
      );
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

// ─── Principal Lookup ─────────────────────────────────────────────────────────

export function useGetPrincipalByUsername(username: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["principalByUsername", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      const principal = await actor.getPrincipalByUsername(username);
      return principal ? principal.toString() : null;
    },
    enabled: !!actor && !actorFetching && !!username,
  });
}

// ─── Video Counts ─────────────────────────────────────────────────────────────

export function useGetTotalVideoCounts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[bigint, bigint]>({
    queryKey: ["totalVideoCounts"],
    queryFn: async () => {
      if (!actor) return [BigInt(0), BigInt(0)] as [bigint, bigint];
      return actor.getTotalVideoCounts();
    },
    enabled: !!actor && !actorFetching,
  });
}
