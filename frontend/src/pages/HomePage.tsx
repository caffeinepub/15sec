import { useGetAllVideoPosts } from '../hooks/useQueries';
import VideoPostCard from '../components/VideoPostCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data: posts = [], isLoading } = useGetAllVideoPosts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-96" />
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
    <div className="space-y-6">
      {sortedPosts.map((post) => (
        <VideoPostCard key={post.id.toString()} post={post} />
      ))}
    </div>
  );
}
