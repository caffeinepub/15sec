import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLikePost, useIsCallerAdmin, useGetRepliesCountForPost, useGetUserProfile, useDeleteVideoPost } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Trash2, Loader2 } from 'lucide-react';
import type { VideoPost } from '../backend';
import ShareDialog from './ShareDialog';
import ReplyDialog from './ReplyDialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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
  const deletePostMutation = useDeleteVideoPost();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: repliesCount } = useGetRepliesCountForPost(post.id);
  const { data: creatorProfile } = useGetUserProfile(post.creator.toString());
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id);
      setDeleteDialogOpen(false);
      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post. Please try again.');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('video') ||
      target.closest('[role="dialog"]') ||
      target.closest('[role="alertdialog"]')
    ) {
      return;
    }
    navigate({ to: '/video/$videoId', params: { videoId: post.id.toString() } });
  };

  return (
    <>
      <div
        className="relative w-full h-full bg-black overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Video fills the entire card */}
        <video
          src={post.video.getDirectURL()}
          controls
          className="absolute inset-0 w-full h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Gradient overlay at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Top bar: avatar + username + date + delete */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: '/profile/$username', params: { username: post.username } });
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10 border-2 border-white/60">
              <AvatarImage src={avatarUrl} alt={post.username} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {post.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-semibold text-white drop-shadow">{post.username}</p>
              <p className="text-xs text-white/70 drop-shadow">
                {new Date(Number(post.timestamp) / 1000000).toLocaleDateString()}
              </p>
            </div>
          </button>

          {canDelete && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Trash2 className="h-5 w-5 text-destructive" />
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
                  <AlertDialogCancel disabled={deletePostMutation.isPending}>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deletePostMutation.isPending}
                    className="gap-2"
                  >
                    {deletePostMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Bottom bar: title + action buttons */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-6 flex items-end justify-between gap-4">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base drop-shadow line-clamp-2">
              {post.title}
            </h3>
          </div>

          {/* Action buttons stacked vertically on the right */}
          <div className="flex flex-col items-center gap-4 pb-1">
            <button
              className="flex flex-col items-center gap-1 text-white hover:text-red-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={likePostMutation.isPending}
            >
              <Heart className="h-7 w-7 drop-shadow" />
              <span className="text-xs font-medium drop-shadow">{post.likes.toString()}</span>
            </button>

            <button
              className="flex flex-col items-center gap-1 text-white hover:text-blue-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowReplyDialog(true);
              }}
            >
              <MessageCircle className="h-7 w-7 drop-shadow" />
              <span className="text-xs font-medium drop-shadow">{repliesCount?.toString() || '0'}</span>
            </button>

            <button
              className="flex flex-col items-center gap-1 text-white hover:text-green-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowShareDialog(true);
              }}
            >
              <Share2 className="h-7 w-7 drop-shadow" />
              <span className="text-xs font-medium drop-shadow">{post.shares.toString()}</span>
            </button>
          </div>
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
