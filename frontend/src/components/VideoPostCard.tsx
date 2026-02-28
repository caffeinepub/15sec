import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLikePost, useIsCallerAdmin, useGetRepliesCountForPost, useGetUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import type { VideoPost } from '../backend';
import ShareDialog from './ShareDialog';
import ReplyDialog from './ReplyDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VideoPostCardProps {
  post: VideoPost;
  onDelete?: (postId: bigint) => void;
}

function getAvatarUrl(avatar: Uint8Array | undefined): string | undefined {
  if (!avatar) return undefined;
  const blob = new Blob([new Uint8Array(avatar)], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}

export default function VideoPostCard({ post, onDelete }: VideoPostCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const likePostMutation = useLikePost();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: repliesCount } = useGetRepliesCountForPost(post.id);
  const { data: creatorProfile } = useGetUserProfile(post.creator.toString());
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isOwner = identity?.getPrincipal().toString() === post.creator.toString();
  const canDelete = isOwner || isAdmin;

  const avatarUrl = creatorProfile?.avatar
    ? getAvatarUrl(creatorProfile.avatar)
    : undefined;

  const handleLike = async () => {
    try {
      await likePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('video') ||
      target.closest('[role="dialog"]')
    ) {
      return;
    }
    navigate({ to: '/video/$videoId', params: { videoId: post.id.toString() } });
  };

  return (
    <>
      <Card className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors" onClick={handleCardClick}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: '/profile/$username', params: { username: post.username } });
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={post.username} />
                <AvatarFallback>{post.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold">{post.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(Number(post.timestamp) / 1000000).toLocaleDateString()}
                </p>
              </div>
            </button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this post and all its replies. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <h3 className="font-semibold mb-3">{post.title}</h3>
          <video
            src={post.video.getDirectURL()}
            controls
            className="w-full rounded-lg bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        </CardContent>

        <CardFooter className="flex items-center gap-4 pt-3">
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
            <span>{repliesCount?.toString() || '0'}</span>
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
        </CardFooter>
      </Card>

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
