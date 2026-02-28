import { useFollowUser, useUnfollowUser, useIsFollowing } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FollowButtonProps {
  targetPrincipal: string;
}

export default function FollowButton({ targetPrincipal }: FollowButtonProps) {
  const { data: isFollowing, isLoading } = useIsFollowing(targetPrincipal);
  const { mutate: follow, isPending: isFollowPending } = useFollowUser();
  const { mutate: unfollow, isPending: isUnfollowPending } = useUnfollowUser();

  const handleClick = () => {
    if (isFollowing) {
      unfollow(targetPrincipal, {
        onError: () => toast.error('Failed to unfollow'),
      });
    } else {
      follow(targetPrincipal, {
        onError: () => toast.error('Failed to follow'),
      });
    }
  };

  const isPending = isFollowPending || isUnfollowPending;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isPending}
      variant={isFollowing ? 'outline' : 'default'}
    >
      {isPending ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
