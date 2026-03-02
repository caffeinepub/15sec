import { useGetAllVideoPosts } from '../hooks/useQueries';
import VideoPostCard from '../components/VideoPostCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data: posts = [], isLoading } = useGetAllVideoPosts();

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-4rem)] overflow-hidden">
        <div className="snap-feed h-full overflow-y-scroll">
          {[1, 2, 3].map((i) => (
            <div key={i} className="snap-card h-[calc(100dvh-4rem)] flex-shrink-0">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-[calc(100dvh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">No videos yet. Be the first to post!</p>
      </div>
    );
  }

  const sortedPosts = [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="snap-feed h-[calc(100dvh-4rem)] overflow-y-scroll">
      {sortedPosts.map((post) => (
        <div key={post.id.toString()} className="snap-card h-[calc(100dvh-4rem)] flex-shrink-0">
          <VideoPostCard post={post} />
        </div>
      ))}
    </div>
  );
}
