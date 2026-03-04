import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VideoReplyCreator from "./VideoReplyCreator";

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentVideoId: bigint;
}

export default function ReplyDialog({
  open,
  onOpenChange,
  parentVideoId,
}: ReplyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
        w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]
        sm:w-full sm:max-w-2xl
        rounded-lg
        overflow-y-auto overflow-x-hidden
        max-h-[90dvh]
        p-4
      "
      >
        <DialogHeader className="pr-6">
          <DialogTitle>Reply with a video</DialogTitle>
          <DialogDescription>
            Record or upload a video reply (max 5 seconds)
          </DialogDescription>
        </DialogHeader>
        <VideoReplyCreator
          parentVideoId={parentVideoId}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
