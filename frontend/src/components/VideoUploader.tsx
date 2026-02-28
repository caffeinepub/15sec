import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploaderProps {
  maxDuration: number;
  onVideoSelected: (file: File) => void;
}

export default function VideoUploader({ maxDuration, onVideoSelected }: VideoUploaderProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimVideo = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = async () => {
        const duration = video.duration;

        // If video is within duration limit, return original file
        if (duration <= maxDuration) {
          window.URL.revokeObjectURL(video.src);
          resolve(file);
          return;
        }

        // Video exceeds maxDuration, trim it
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context not available');
          }

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Create MediaRecorder to capture trimmed video
          const stream = canvas.captureStream(30); // 30 fps
          
          // Get audio track from original video if available
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioContext.destination);
          
          // Add audio track to stream if available
          if (destination.stream.getAudioTracks().length > 0) {
            destination.stream.getAudioTracks().forEach(track => {
              stream.addTrack(track);
            });
          }

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8,opus',
          });

          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const trimmedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
              type: 'video/webm',
            });
            window.URL.revokeObjectURL(video.src);
            audioContext.close();
            resolve(trimmedFile);
          };

          // Start recording
          mediaRecorder.start();

          // Play video and draw frames to canvas
          video.currentTime = 0;
          video.play();

          const drawFrame = () => {
            if (video.currentTime >= maxDuration) {
              mediaRecorder.stop();
              video.pause();
              return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          };

          video.addEventListener('play', () => {
            drawFrame();
          });

          // Stop recording after maxDuration
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              video.pause();
            }
          }, maxDuration * 1000 + 500); // Add 500ms buffer

        } catch (error) {
          window.URL.revokeObjectURL(video.src);
          reject(error);
        }
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setProcessing(true);

    try {
      const processedFile = await trimVideo(file);
      setSelectedVideo(URL.createObjectURL(processedFile));
      onVideoSelected(processedFile);
    } catch (error) {
      console.error('Video processing error:', error);
      toast.error('Failed to process video');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {selectedVideo ? (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video src={selectedVideo} controls className="w-full h-full" />
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="w-full"
          >
            Choose Different Video
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="w-full h-32"
          variant="outline"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8" />
            <span>{processing ? 'Processing...' : 'Choose Video'}</span>
            <span className="text-xs text-muted-foreground">Max {maxDuration} seconds</span>
          </div>
        </Button>
      )}
    </div>
  );
}
