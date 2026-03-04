import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Home, PlusSquare, Shield, User } from "lucide-react";
import { useState } from "react";
import {
  useGetCallerUserProfile,
  useGetUnreadNotificationsCount,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import Branding from "./Branding";
import NotificationPanel from "./NotificationPanel";

function getAvatarUrl(avatar: Uint8Array | undefined): string | undefined {
  if (!avatar) return undefined;
  const blob = new Blob([new Uint8Array(avatar)], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
}

export default function Header() {
  const navigate = useNavigate();
  const { data: unreadCount } = useGetUnreadNotificationsCount();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();
  const hasUnread = unreadCount && unreadCount > BigInt(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const avatarUrl = userProfile?.avatar
    ? getAvatarUrl(userProfile.avatar)
    : undefined;
  const avatarFallback = userProfile?.username?.[0]?.toUpperCase() ?? "";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Branding />
        </button>

        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/create" })}
            aria-label="Create"
          >
            <PlusSquare className="h-5 w-5" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              )}
            </Button>
            {showNotifications && (
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {!isAdminLoading && isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/admin" })}
              aria-label="Admin Dashboard"
            >
              <Shield className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/account" })}
            aria-label="Account"
            className="relative"
          >
            {avatarUrl || avatarFallback ? (
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} alt={userProfile?.username} />
                <AvatarFallback className="text-xs">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
