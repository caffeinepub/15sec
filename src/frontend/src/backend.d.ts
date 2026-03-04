import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type NotificationType = {
    __kind__: "like";
    like: {
        videoId: bigint;
    };
} | {
    __kind__: "share";
    share: {
        videoId: bigint;
    };
} | {
    __kind__: "reply";
    reply: {
        videoId: bigint;
    };
};
export type Time = bigint;
export interface VideoReply {
    id: bigint;
    parentVideoId: bigint;
    creator: Principal;
    shares: bigint;
    username: string;
    video: ExternalBlob;
    timestamp: Time;
}
export interface Notification {
    notificationType: NotificationType;
    recipient: Principal;
    isRead: boolean;
    sender: Principal;
    timestamp: Time;
}
export interface VideoPost {
    id: bigint;
    title: string;
    creator: Principal;
    shares: bigint;
    username: string;
    video: ExternalBlob;
    likes: bigint;
    timestamp: Time;
}
export interface VisitorStats {
    allTime: bigint;
    monthly: bigint;
    daily: bigint;
    weekly: bigint;
}
export interface UserProfile {
    username: string;
    deletionTimestamp?: Time;
    avatar?: Uint8Array;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelAccountDeletion(): Promise<void>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    createVideoPost(_title: string, video: ExternalBlob): Promise<bigint>;
    createVideoReply(parentVideoId: bigint, video: ExternalBlob): Promise<bigint>;
    deleteAccount(): Promise<void>;
    deleteVideoPost(postId: bigint): Promise<void>;
    deleteVideoReply(replyId: bigint): Promise<void>;
    demoteUser(adminToRemove: Principal): Promise<void>;
    followUser(target: Principal): Promise<void>;
    getAccountDeletionTimeRemaining(): Promise<bigint | null>;
    getActiveAccountsCount(): Promise<bigint>;
    getAllDeletionTimestamps(): Promise<Array<[Principal, Time | null]>>;
    getAllVideoPosts(): Promise<Array<VideoPost>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDonateText(): Promise<string>;
    getFollowersAndFollowingCounts(user: Principal): Promise<[bigint, bigint]>;
    getFollowersCount(_user: Principal): Promise<bigint>;
    getFollowingCount(_user: Principal): Promise<bigint>;
    getNotifications(): Promise<Array<Notification>>;
    getPrincipalByUsername(username: string): Promise<Principal | null>;
    getRepliesCountForPost(videoId: bigint): Promise<bigint>;
    getRepliesForPost(_videoId: bigint): Promise<Array<VideoReply>>;
    getRepliesForPostWithPagination(videoId: bigint, startIndex: bigint, batchSize: bigint): Promise<Array<VideoReply>>;
    getReplyLikesCount(replyId: bigint): Promise<bigint>;
    getReplySharesCount(replyId: bigint): Promise<bigint>;
    getScheduledDeletions(): Promise<Array<[Principal, Time]>>;
    getTotalVideoCounts(): Promise<[bigint, bigint]>;
    getUnreadNotificationsCount(): Promise<bigint>;
    getUserAccountDeletionTimeRemaining(_user: Principal): Promise<bigint | null>;
    getUserFollowers(_user: Principal): Promise<Array<Principal>>;
    getUserFollowing(_user: Principal): Promise<Array<Principal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideoPostById(id: bigint): Promise<VideoPost | null>;
    getVideoPostsByUser(user: Principal): Promise<Array<VideoPost>>;
    getVideoRepliesByUser(user: Principal): Promise<Array<VideoReply>>;
    getVideoReplyById(id: bigint): Promise<VideoReply | null>;
    getVisitorStats(): Promise<VisitorStats>;
    hasUserLikedReply(replyId: bigint, user: Principal): Promise<boolean>;
    hasUserLikedReplyForCaller(replyId: bigint): Promise<boolean>;
    isAdmin(user: Principal): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(target: Principal): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    likeReply(replyId: bigint): Promise<void>;
    markNotificationsAsRead(): Promise<void>;
    performAutomatedAccountDeletion(): Promise<void>;
    permanentlyDeleteAccount(target: Principal): Promise<void>;
    promoteUser(newAdmin: Principal): Promise<void>;
    recordVisit(): Promise<void>;
    revalidateSession(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setDonateText(text: string): Promise<void>;
    sharePost(postId: bigint): Promise<void>;
    shareReply(replyId: bigint): Promise<void>;
    unfollowUser(target: Principal): Promise<void>;
    unlikeReply(replyId: bigint): Promise<void>;
}
