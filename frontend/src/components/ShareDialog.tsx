import { useState } from 'react';
import { useSharePost, useShareReply } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: bigint;
  replyId?: bigint;
}

export default function ShareDialog({ open, onOpenChange, postId, replyId }: ShareDialogProps) {
  const { mutate: sharePost } = useSharePost();
  const { mutate: shareReply } = useShareReply();
  const [copied, setCopied] = useState(false);

  // If a replyId is provided, link to the post detail page (replies are shown there)
  const shareUrl = replyId
    ? `${window.location.origin}/video/${postId}#reply-${replyId}`
    : `${window.location.origin}/video/${postId}`;

  const triggerShare = (onSuccess?: () => void, onError?: () => void) => {
    if (replyId !== undefined) {
      shareReply(replyId, { onSuccess, onError });
    } else {
      sharePost(postId, { onSuccess, onError });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      triggerShare();
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleInternalShare = () => {
    triggerShare(
      () => {
        toast.success('Shared successfully!');
        onOpenChange(false);
      },
      () => {
        toast.error('Failed to share');
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {replyId !== undefined ? 'reply' : 'video'}</DialogTitle>
          <DialogDescription>
            Share this {replyId !== undefined ? 'reply' : 'video'} with others
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Share link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button
                type="button"
                size="icon"
                onClick={handleCopyLink}
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleInternalShare} className="w-full">
            Share on 15sec
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
