import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VideoUploader from '../components/VideoUploader';
import VideoRecorder from '../components/VideoRecorder';
import VideoPostCreator from '../components/VideoPostCreator';

export default function CreatePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'upload' | 'record'>('select');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleVideoSelected = (file: File) => {
    setVideoFile(file);
  };

  const handlePostCreated = () => {
    navigate({ to: '/' });
  };

  const handleBack = () => {
    setMode('select');
    setVideoFile(null);
  };

  if (mode === 'select') {
    return (
      <div className="container max-w-2xl mx-auto p-4 pt-20">
        <Card>
          <CardHeader>
            <CardTitle>Share your world in 15 seconds.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode('upload')}
              className="w-full"
              size="lg"
            >
              Upload Video
            </Button>
            <Button
              onClick={() => setMode('record')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Record Video
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'upload') {
    if (!videoFile) {
      return (
        <div className="container max-w-2xl mx-auto p-4 pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>Select a video file (max 15 seconds)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VideoUploader onVideoSelected={handleVideoSelected} maxDuration={15} />
              <Button onClick={handleBack} variant="outline" className="w-full">
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container max-w-2xl mx-auto p-4 pt-20">
        <VideoPostCreator
          videoFile={videoFile}
          onSuccess={handlePostCreated}
          onCancel={handleBack}
        />
      </div>
    );
  }

  if (mode === 'record') {
    if (!videoFile) {
      return (
        <div className="container max-w-2xl mx-auto p-4 pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Record Video</CardTitle>
              <CardDescription>Record a video (max 15 seconds)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VideoRecorder onVideoRecorded={handleVideoSelected} maxDuration={15} />
              <Button onClick={handleBack} variant="outline" className="w-full">
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container max-w-2xl mx-auto p-4 pt-20">
        <VideoPostCreator
          videoFile={videoFile}
          onSuccess={handlePostCreated}
          onCancel={handleBack}
        />
      </div>
    );
  }

  return null;
}
