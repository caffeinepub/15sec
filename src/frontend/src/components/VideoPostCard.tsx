import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Loader2, MessageCircle, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { VideoPost } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteVideoPost,
  useGetRepliesCountForPost,
  useGetUserProfile,
  useIsCallerAdmin,
  useLikePost,
} from "../hooks/useQueries";
import ReplyDialog from "./ReplyDialog";
import ShareDialog from "./ShareDialog";

interface VideoPostCardProps {
  post: VideoPost;
  onDelete?: (postId: bigint) => void;
}

function getAvatarUrl(avatar: Uint8Array | undefined): string | undefined {
  if (!avatar) return undefined;
  const blob = new Blob([new Uint8Array(avatar)], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
}

export default function VideoPostCard({ post, onDelete }: VideoPostCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const likePostMutation = useLikePost();
  const deletePostMutation = useDeleteVideoPost();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: repliesCount } = useGetRepliesCountForPost(post.id);
  const { data: creatorProfile } = useGetUserProfile(post.creator.toString());
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner =
    identity?.getPrincipal().toString() === post.creator.toString();
  const canDelete = isOwner || isAdmin;

  const avatarUrl = creatorProfile?.avatar
    ? getAvatarUrl(creatorProfile.avatar)
    : undefined;

  const handleLike = async () => {
    try {
      await likePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id);
      setDeleteDialogOpen(false);
      toast.success("Post deleted successfully");
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post. Please try again.");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("video") ||
      target.closest('[role="dialog"]') ||
      target.closest('[role="alertdialog"]')
    ) {
      return;
    }
    navigate({
      to: "/video/$videoId",
      params: { videoId: post.id.toString() },
    });
  };

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: card click is supplementary, interactive children handle keyboard */}
      <div
        className="flex flex-col h-full w-full overflow-hidden cursor-pointer bg-card border-b border-border"
        onClick={handleCardClick}
      >
        {/* Header: avatar + username + date + delete */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate({
                to: "/profile/$username",
                params: { username: post.username },
              });
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={post.username} />
              <AvatarFallback>{post.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-semibold text-sm">{post.username}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(
                  Number(post.timestamp) / 1000000,
                ).toLocaleDateString()}
              </p>
            </div>
          </button>

          {canDelete && (
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this post and all its replies.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletePostMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deletePostMutation.isPending}
                    className="gap-2"
                  >
                    {deletePostMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {deletePostMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Title */}
        <div className="px-4 pb-2 shrink-0">
          <h3 className="font-semibold text-sm">{post.title}</h3>
        </div>

        {/* Video — fills remaining space */}
        <div className="flex-1 min-h-0 px-4 pb-2">
          {/* biome-ignore lint/a11y/useMediaCaption: short-form user video, captions not applicable */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only, video controls handle keyboard */}
          <video
            src={post.video.getDirectURL()}
            controls
            className="w-full h-full rounded-lg bg-black object-contain"
            onClick={(e) => e.stopPropagation()}
            playsInline
          />
        </div>

        {/* Footer: action buttons */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={likePostMutation.isPending}
          >
            <Heart className="h-4 w-4" />
            <span>{post.likes.toString()}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyDialog(true);
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{repliesCount?.toString() || "0"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowShareDialog(true);
            }}
          >
            <Share2 className="h-4 w-4" />
            <span>{post.shares.toString()}</span>
          </Button>
        </div>
      </div>

      <ReplyDialog
        open={showReplyDialog}
        onOpenChange={setShowReplyDialog}
        parentVideoId={post.id}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        postId={post.id}
      />
    </>
  );
}
