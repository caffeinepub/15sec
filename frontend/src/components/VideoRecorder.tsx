import { useState, useEffect } from 'react';
import { useCamera } from '../camera/useCamera';
import { Button } from '@/components/ui/button';
import { Camera, StopCircle, RotateCw, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoRecorderProps {
  maxDuration: number;
  onVideoRecorded: (file: File) => void;
}

export default function VideoRecorder({ maxDuration, onVideoRecorded }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    switchCamera,
    videoRef,
  } = useCamera({
    facingMode: 'environment',
    width: 1280,
    height: 720,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (recordingTime >= maxDuration && isRecording) {
      handleStopRecording();
    }
  }, [recordingTime, maxDuration, isRecording]);

  const handleStartRecording = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('Camera not ready');
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        onVideoRecorded(file);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast.error('Failed to start recording');
      console.error(error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleRetry = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
  };

  const handleSwitchCamera = async () => {
    await switchCamera();
  };

  if (isSupported === false) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Camera is not supported in your browser</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (recordedVideo) {
    return (
      <div className="space-y-4 w-full min-w-0">
        <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3' }}>
          <video src={recordedVideo} controls className="w-full h-full object-contain" />
        </div>
        <Button variant="outline" onClick={handleRetry} className="w-full">
          Record Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      <div
        className="relative bg-black rounded-lg overflow-hidden w-full"
        style={{ aspectRatio: '4/3' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isRecording && (
          <div className="absolute top-3 left-3 bg-destructive text-white px-3 py-1 rounded-full flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-semibold">{recordingTime}s / {maxDuration}s</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full min-w-0">
        {!isActive ? (
          <Button onClick={startCamera} disabled={isLoading} className="flex-1 min-w-0">
            <Camera className="h-4 w-4 mr-2" />
            {isLoading ? 'Starting...' : 'Start Camera'}
          </Button>
        ) : (
          <>
            {!isRecording ? (
              <>
                <Button onClick={handleStartRecording} disabled={isLoading} className="flex-1 min-w-0">
                  <Video className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
                <Button onClick={handleSwitchCamera} disabled={isLoading} variant="outline" size="icon" className="shrink-0">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleStopRecording} variant="destructive" className="flex-1 min-w-0">
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
