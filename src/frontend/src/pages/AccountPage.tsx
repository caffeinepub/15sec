import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Moon, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import VideoPostCard from "../components/VideoPostCard";
import VideoReplyCard from "../components/VideoReplyCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCancelAccountDeletion,
  useCheckUsernameAvailability,
  useDeleteAccount,
  useGetAccountDeletionTimeRemaining,
  useGetCallerUserProfile,
  useGetFollowersAndFollowingCounts,
  useGetVideoPostsByUser,
  useGetVideoRepliesByUser,
  useIsCallerAdmin,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

export default function AccountPage() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: posts = [] } = useGetVideoPostsByUser(
    identity?.getPrincipal().toString() ?? null,
  );
  const { data: replies = [] } = useGetVideoRepliesByUser(
    identity?.getPrincipal().toString() ?? null,
  );
  const { data: deletionTimeRemaining } = useGetAccountDeletionTimeRemaining();
  const { data: followCounts } = useGetFollowersAndFollowingCounts(
    identity?.getPrincipal().toString() ?? null,
  );

  const followersCount = followCounts ? Number(followCounts[0]) : 0;
  const followingCount = followCounts ? Number(followCounts[1]) : 0;

  const saveProfile = useSaveCallerUserProfile();
  const checkUsername = useCheckUsernameAvailability();
  const deleteAccount = useDeleteAccount();
  const cancelDeletion = useCancelAccountDeletion();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const handleUsernameCheck = async (username: string) => {
    setNewUsername(username);
    setUsernameError("");
    setUsernameAvailable(null);

    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Only letters, numbers, and underscores allowed");
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await checkUsername.mutateAsync(username);
      setUsernameAvailable(available);
      if (!available) setUsernameError("Username already taken");
    } catch {
      setUsernameError("Error checking username");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!userProfile || !usernameAvailable) return;
    try {
      await saveProfile.mutateAsync({
        ...userProfile,
        username: newUsername,
      });
      setEditingUsername(false);
      setNewUsername("");
      setUsernameAvailable(null);
    } catch {
      setUsernameError("Failed to save username");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      try {
        await saveProfile.mutateAsync({
          ...userProfile,
          avatar: uint8Array,
        });
      } catch {
        // silently fail
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const formatDeletionTime = (nanoseconds: bigint) => {
    const ms = Number(nanoseconds) / 1_000_000;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const getAvatarUrl = () => {
    if (!userProfile?.avatar) return null;
    const blob = new Blob([new Uint8Array(userProfile.avatar)], {
      type: "image/jpeg",
    });
    return URL.createObjectURL(blob);
  };

  const sortedPosts = [...posts].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );
  const sortedReplies = [...replies].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              className="w-20 h-20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {getAvatarUrl() ? (
                <AvatarImage
                  src={getAvatarUrl()!}
                  alt={userProfile?.username}
                />
              ) : (
                <AvatarFallback className="text-2xl bg-muted">
                  {userProfile?.username?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Username & Info */}
          <div className="flex-1 min-w-0">
            {editingUsername ? (
              <div className="space-y-2">
                <Input
                  value={newUsername}
                  onChange={(e) => handleUsernameCheck(e.target.value)}
                  placeholder="New username"
                  className="h-8 text-sm"
                />
                {checkingUsername && (
                  <p className="text-xs text-muted-foreground">Checking...</p>
                )}
                {usernameError && (
                  <p className="text-xs text-destructive">{usernameError}</p>
                )}
                {usernameAvailable && (
                  <p className="text-xs text-green-500">Username available!</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                    disabled={!usernameAvailable || saveProfile.isPending}
                  >
                    {saveProfile.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingUsername(false);
                      setNewUsername("");
                      setUsernameError("");
                      setUsernameAvailable(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg truncate">
                    {userProfile?.username}
                  </h2>
                  {isAdmin && (
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUsername(true);
                    setNewUsername(userProfile?.username ?? "");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  Edit username
                </button>
              </div>
            )}

            {/* Followers / Following counts */}
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <p className="font-bold text-base leading-tight">
                  {followersCount}
                </p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-base leading-tight">
                  {followingCount}
                </p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deletion warning */}
        {deletionTimeRemaining && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              Account scheduled for deletion in{" "}
              {formatDeletionTime(deletionTimeRemaining)}.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => cancelDeletion.mutate()}
              disabled={cancelDeletion.isPending}
            >
              {cancelDeletion.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Cancel Deletion
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {isAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate({ to: "/admin" })}
              data-ocid="account.admin_dashboard.button"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          {!deletionTimeRemaining && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your account will be scheduled for deletion in 14 days. You
                    can cancel this within that period. After 14 days, all your
                    data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccount.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Schedule Deletion
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Posts & Replies Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts ({sortedPosts.length})</TabsTrigger>
          <TabsTrigger value="replies">
            Replies ({sortedReplies.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-6 mt-6">
          {sortedPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No posts yet
            </p>
          ) : (
            sortedPosts.map((post) => (
              <VideoPostCard key={post.id.toString()} post={post} />
            ))
          )}
        </TabsContent>
        <TabsContent value="replies" className="space-y-6 mt-6">
          {sortedReplies.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No replies yet
            </p>
          ) : (
            sortedReplies.map((reply) => (
              <VideoReplyCard
                key={reply.id.toString()}
                reply={reply}
                showDelete
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
