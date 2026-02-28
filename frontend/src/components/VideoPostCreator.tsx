import { useState } from 'react';
import { useCreateVideoPost } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoPostCreatorProps {
  videoFile: File;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VideoPostCreator({ videoFile, onSuccess, onCancel }: VideoPostCreatorProps) {
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { mutate: createPost } = useCreateVideoPost();
  const { actor, isFetching: actorFetching } = useActor();

  const isActorReady = !!actor && !actorFetching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!isActorReady) {
      toast.error('System is initializing, please wait...');
      return;
    }

    try {
      setUploading(true);
      const arrayBuffer = await videoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      createPost(
        { title: title.trim(), video: blob },
        {
          onSuccess: () => {
            toast.success('Video posted successfully!');
            onSuccess?.();
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to post video');
            setUploading(false);
          },
        }
      );
    } catch (error) {
      toast.error('Failed to process video');
      setUploading(false);
    }
  };

  if (!isActorReady) {
    return (
      <Alert>
        <AlertDescription>Initializing system, please wait...</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your video a title"
          disabled={uploading}
          maxLength={100}
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={uploading} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={uploading || !title.trim()} className="flex-1">
          {uploading ? 'Posting...' : 'Post Video'}
        </Button>
      </div>
    </form>
  );
}
