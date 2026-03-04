import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import VideoPostCard from "../components/VideoPostCard";
import VideoReplyCard from "../components/VideoReplyCard";
import {
  useGetRepliesCountForPost,
  useGetRepliesForPostWithPagination,
  useGetVideoPostById,
} from "../hooks/useQueries";

export default function VideoDetailPage() {
  const { videoId } = useParams({ from: "/video/$videoId" });
  const navigate = useNavigate();
  const [loadedReplies, setLoadedReplies] = useState<number>(5);

  const videoIdBigInt = videoId ? BigInt(videoId) : null;

  const { data: post, isLoading: postLoading } =
    useGetVideoPostById(videoIdBigInt);
  const { data: replies, isLoading: repliesLoading } =
    useGetRepliesForPostWithPagination(
      videoIdBigInt,
      BigInt(0),
      BigInt(loadedReplies),
    );
  const { data: totalRepliesCount } = useGetRepliesCountForPost(
    post?.id ?? null,
  );

  const handleLoadMore = () => {
    setLoadedReplies((prev) => prev + 5);
  };

  const hasMoreReplies =
    totalRepliesCount !== undefined && replies
      ? Number(totalRepliesCount) > replies.length
      : false;

  if (postLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pt-20">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pt-20">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Video not found</p>
            <Button onClick={() => navigate({ to: "/" })} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pt-20 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/" })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Button>

      <VideoPostCard post={post} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Replies ({totalRepliesCount?.toString() || "0"})
        </h2>

        {repliesLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading replies...</p>
            </CardContent>
          </Card>
        ) : replies && replies.length > 0 ? (
          <>
            {replies.map((reply) => (
              <VideoReplyCard key={reply.id.toString()} reply={reply} />
            ))}
            {hasMoreReplies && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleLoadMore} variant="outline">
                  Load More Replies
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No replies yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
