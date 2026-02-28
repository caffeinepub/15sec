import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useDeleteVideoReply,
  useIsCallerAdmin,
  useGetReplyLikesCount,
  useHasUserLikedReply,
  useLikeReply,
  useUnlikeReply,
  useGetReplySharesCount,
  useGetRepliesCountForPost,
  useGetUserProfile,
} from '../hooks/useQueries';
import type { VideoReply } from '../backend';
import { Trash2, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import ShareDialog from './ShareDialog';
import ReplyDialog from './ReplyDialog';

interface VideoReplyCardProps {
  reply: VideoReply;
  showDelete?: boolean;
}

function getAvatarUrl(avatar: Uint8Array | undefined): string | undefined {
  if (!avatar) return undefined;
  const blob = new Blob([new Uint8Array(avatar)], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}

export default function VideoReplyCard({ reply, showDelete = false }: VideoReplyCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { mutate: deleteReply } = useDeleteVideoReply();
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

  const isOwner = identity?.getPrincipal().toString() === reply.creator.toString();
  const videoUrl = reply.video.getDirectURL();

  const avatarUrl = creatorProfile?.avatar
    ? getAvatarUrl(creatorProfile.avatar)
    : undefined;

  const handleAvatarClick = () => {
    if (isOwner) {
      navigate({ to: '/account' });
    } else {
      navigate({ to: '/profile/$username', params: { username: reply.username } });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this reply?')) {
      deleteReply(reply.id, {
        onSuccess: () => {
          toast.success('Reply deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete reply');
        },
      });
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
      console.error('Failed to toggle like on reply:', error);
    }
  };

  const showDeleteButton = (showDelete && isOwner) || isAdmin;
  const isLikePending = likeReplyMutation.isPending || unlikeReplyMutation.isPending;

  return (
    <>
      <Card className="overflow-hidden ml-8 border-l-4 border-l-accent">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={reply.username} />
                <AvatarFallback>{reply.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{reply.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(Number(reply.timestamp) / 1000000).toLocaleDateString()}
                </p>
              </div>
            </div>
            {showDeleteButton && (
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Video */}
          <div className="relative bg-black aspect-video">
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
            className={`gap-2 ${hasLiked ? 'text-destructive' : ''}`}
            onClick={handleLike}
            disabled={isLikePending}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
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
