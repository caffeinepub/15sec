import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useCreateVideoReply } from "../hooks/useQueries";
import VideoRecorder from "./VideoRecorder";
import VideoUploader from "./VideoUploader";

interface VideoReplyCreatorProps {
  parentVideoId: bigint;
  onSuccess?: () => void;
}

export default function VideoReplyCreator({
  parentVideoId,
  onSuccess,
}: VideoReplyCreatorProps) {
  const [mode, setMode] = useState<"select" | "upload" | "record">("select");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { mutate: createReply } = useCreateVideoReply();
  const { actor, isFetching: actorFetching } = useActor();

  const isActorReady = !!actor && !actorFetching;

  const handleVideoSelected = (file: File) => {
    setVideoFile(file);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      toast.error("Please select a video");
      return;
    }

    if (!isActorReady) {
      toast.error("System is initializing, please wait...");
      return;
    }

    try {
      setUploading(true);
      const arrayBuffer = await videoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        },
      );

      createReply(
        { parentVideoId, video: blob },
        {
          onSuccess: () => {
            toast.success("Reply posted successfully!");
            onSuccess?.();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to post reply");
            setUploading(false);
          },
        },
      );
    } catch (_error) {
      toast.error("Failed to process video");
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

  if (mode === "select") {
    return (
      <div className="space-y-4 w-full min-w-0">
        <Button onClick={() => setMode("upload")} className="w-full" size="lg">
          Upload from Library
        </Button>
        <Button
          onClick={() => setMode("record")}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Record Video
        </Button>
      </div>
    );
  }

  if (mode === "upload") {
    return (
      <div className="space-y-4 w-full min-w-0">
        <div className="w-full min-w-0 overflow-hidden">
          <VideoUploader
            maxDuration={5}
            onVideoSelected={handleVideoSelected}
          />
        </div>
        {videoFile && (
          <>
            {uploading && (
              <div className="space-y-2 w-full min-w-0">
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
            <div className="flex gap-2 w-full min-w-0">
              <Button
                variant="outline"
                onClick={() => {
                  setMode("select");
                  setVideoFile(null);
                }}
                disabled={uploading}
                className="flex-1 min-w-0"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 min-w-0"
              >
                {uploading ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </>
        )}
        {!videoFile && (
          <Button
            variant="outline"
            onClick={() => setMode("select")}
            className="w-full"
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  // record mode
  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="w-full min-w-0 overflow-hidden rounded-lg">
        <VideoRecorder maxDuration={5} onVideoRecorded={handleVideoSelected} />
      </div>
      {videoFile && (
        <>
          {uploading && (
            <div className="space-y-2 w-full min-w-0">
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
          <div className="flex gap-2 w-full min-w-0">
            <Button
              variant="outline"
              onClick={() => {
                setMode("select");
                setVideoFile(null);
              }}
              disabled={uploading}
              className="flex-1 min-w-0"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 min-w-0"
            >
              {uploading ? "Posting..." : "Post Reply"}
            </Button>
          </div>
        </>
      )}
      {!videoFile && (
        <Button
          variant="outline"
          onClick={() => setMode("select")}
          className="w-full"
        >
          Back
        </Button>
      )}
    </div>
  );
}
