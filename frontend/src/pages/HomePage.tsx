import { useGetAllVideoPosts } from '../hooks/useQueries';
import VideoPostCard from '../components/VideoPostCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data: posts = [], isLoading } = useGetAllVideoPosts();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-[calc(100dvh-4rem)]" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No videos yet. Be the first to post!</p>
      </div>
    );
  }

  const sortedPosts = [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-scroll snap-y snap-mandatory">
      {sortedPosts.map((post) => (
        <div
          key={post.id.toString()}
          className="h-[calc(100dvh-4rem)] snap-start snap-always flex flex-col"
        >
          <VideoPostCard post={post} />
        </div>
      ))}
    </div>
  );
}
