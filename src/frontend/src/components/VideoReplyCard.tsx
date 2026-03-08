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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Loader2, MessageCircle, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { VideoReply } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteVideoReply,
  useGetRepliesCountForPost,
  useGetReplyLikesCount,
  useGetReplySharesCount,
  useGetUserProfile,
  useHasUserLikedReply,
  useIsCallerAdmin,
  useLikeReply,
  useUnlikeReply,
} from "../hooks/useQueries";
import ReplyDialog from "./ReplyDialog";
import ShareDialog from "./ShareDialog";

interface VideoReplyCardProps {
  reply: VideoReply;
  showDelete?: boolean;
}

function getAvatarUrl(avatar: Uint8Array | undefined): string | undefined {
  if (!avatar) return undefined;
  const blob = new Blob([new Uint8Array(avatar)], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
}

export default function VideoReplyCard({
  reply,
  showDelete = false,
}: VideoReplyCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const deleteReplyMutation = useDeleteVideoReply();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: creatorProfile } = useGetUserProfile(reply.creator.toString());

  const { data: likesCount } = useGetReplyLikesCount(reply.id);
  const { data: hasLiked } = useHasUserLikedReply(reply.id);
  const likeReplyMutation = useLikeReply();
  const unlikeReplyMutation = useUnlikeReply();
  const { data: sharesCount } = useGetReplySharesCount(reply.id);
  const { data: repliesCount } = useGetRepliesCountForPost(reply.parentVideoId);

  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner =
    identity?.getPrincipal().toString() === reply.creator.toString();
  const videoUrl = reply.video.getDirectURL();

  const avatarUrl = creatorProfile?.avatar
    ? getAvatarUrl(creatorProfile.avatar)
    : undefined;

  const handleAvatarClick = () => {
    if (isOwner) {
      navigate({ to: "/account" });
    } else {
      navigate({
        to: "/profile/$username",
        params: { username: reply.username },
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReplyMutation.mutateAsync(reply.id);
      setDeleteDialogOpen(false);
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Failed to delete reply:", error);
      toast.error("Failed to delete reply. Please try again.");
    }
  };

  const handleLike = async () => {
    try {
      if (hasLiked) {
        await unlikeReplyMutation.mutateAsync(reply.id);
      } else {
        await likeReplyMutation.mutateAsync(reply.id);
      }
    } catch (error) {
      console.error("Failed to toggle like on reply:", error);
    }
  };

  const showDeleteButton = (showDelete && isOwner) || isAdmin;
  const isLikePending =
    likeReplyMutation.isPending || unlikeReplyMutation.isPending;

  return (
    <>
      <Card className="overflow-hidden ml-8 border-l-4 border-l-accent">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={reply.username} />
                <AvatarFallback>
                  {reply.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{reply.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(
                    Number(reply.timestamp) / 1000000,
                  ).toLocaleDateString()}
                </p>
              </div>
            </button>
            {showDeleteButton && (
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this reply. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteReplyMutation.isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteReplyMutation.isPending}
                      className="gap-2"
                    >
                      {deleteReplyMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {deleteReplyMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Video */}
          <div className="relative bg-black aspect-video">
            {/* biome-ignore lint/a11y/useMediaCaption: short-form user video, captions not applicable */}
            <video
              src={videoUrl}
              controls
              className="w-full h-full"
              preload="metadata"
            />
          </div>
        </CardContent>

        {/* Footer with interactions */}
        <CardFooter className="flex items-center gap-4 pt-3 pb-3 px-3">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${hasLiked ? "text-destructive" : ""}`}
            onClick={handleLike}
            disabled={isLikePending}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
            <span>{(likesCount ?? BigInt(0)).toString()}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowReplyDialog(true)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{(repliesCount ?? BigInt(0)).toString()}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="h-4 w-4" />
            <span>{(sharesCount ?? BigInt(0)).toString()}</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Reply dialog targets the parent post */}
      <ReplyDialog
        open={showReplyDialog}
        onOpenChange={setShowReplyDialog}
        parentVideoId={reply.parentVideoId}
      />

      {/* Share dialog for this reply */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        postId={reply.parentVideoId}
        replyId={reply.id}
      />
    </>
  );
}
