import { useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetPrincipalByUsername,
  useGetUserProfile,
  useGetVideoPostsByUser,
  useGetVideoRepliesByUser,
  useGetFollowersCount,
  useGetFollowingCount,
  useIsFollowing,
} from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import FollowButton from '../components/FollowButton';
import VideoPostCard from '../components/VideoPostCard';
import VideoReplyCard from '../components/VideoReplyCard';

export default function ProfilePage() {
  const { username } = useParams({ from: '/profile/$username' });
  const { identity } = useInternetIdentity();

  const { data: userPrincipal, isLoading: principalLoading } = useGetPrincipalByUsername(username);
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfile(userPrincipal ?? null);
  const { data: posts = [], isLoading: postsLoading } = useGetVideoPostsByUser(userPrincipal ?? null);
  const { data: replies = [], isLoading: repliesLoading } = useGetVideoRepliesByUser(userPrincipal ?? null);
  const { data: followersCount } = useGetFollowersCount(userPrincipal ?? null);
  const { data: followingCount } = useGetFollowingCount(userPrincipal ?? null);

  // Check if the profile owner follows the current viewer
  const { data: followsYou } = useIsFollowing(
    userPrincipal && identity ? identity.getPrincipal().toString() : null
  );

  const isLoading = principalLoading || profileLoading;

  const avatarUrl = userProfile?.avatar
    ? URL.createObjectURL(new Blob([new Uint8Array(userProfile.avatar)], { type: 'image/jpeg' }))
    : undefined;

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pt-20 space-y-6">
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  if (!userPrincipal || !userProfile) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pt-20">
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = identity?.getPrincipal().toString() === userPrincipal;

  return (
    <div className="container max-w-4xl mx-auto p-4 pt-20 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar & Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={userProfile.username} />
              <AvatarFallback className="text-2xl">
                {userProfile.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{userProfile.username}</h2>
              {followsYou && (
                <p className="text-sm text-muted-foreground">Follows you</p>
              )}
            </div>
            {!isOwnProfile && (
              <FollowButton targetPrincipal={userPrincipal} />
            )}
          </div>

          {/* Follower counts */}
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">{Number(followingCount ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Number(followersCount ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts and Replies Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="replies">Replies ({replies.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-6 mt-6">
          {postsLoading ? (
            <Skeleton className="w-full h-96" />
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No posts yet</p>
          ) : (
            posts.map((post) => (
              <VideoPostCard key={post.id.toString()} post={post} />
            ))
          )}
        </TabsContent>
        <TabsContent value="replies" className="space-y-6 mt-6">
          {repliesLoading ? (
            <Skeleton className="w-full h-96" />
          ) : replies.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No replies yet</p>
          ) : (
            replies.map((reply) => (
              <VideoReplyCard key={reply.id.toString()} reply={reply} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
