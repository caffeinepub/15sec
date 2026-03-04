import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { Notification } from "../backend";
import {
  useGetNotifications,
  useGetUserProfile,
  useMarkNotificationsAsRead,
} from "../hooks/useQueries";

export default function NotificationPanel({
  onClose,
}: { onClose: () => void }) {
  const navigate = useNavigate();
  const { data: notifications = [] } = useGetNotifications();
  const { mutate: markAsRead } = useMarkNotificationsAsRead();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <Card
      ref={panelRef}
      className="absolute right-0 top-12 w-80 max-w-[calc(100vw-1rem)] shadow-lg z-50"
    >
      <CardHeader>
        <CardTitle className="text-lg">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <NotificationItem
                  key={`${notification.sender.toString()}-${notification.timestamp.toString()}-${index}`}
                  notification={notification}
                  navigate={navigate}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  notification,
  navigate,
  onClose,
}: {
  notification: Notification;
  navigate: ReturnType<typeof useNavigate>;
  onClose: () => void;
}) {
  const senderPrincipalStr = notification.sender.toString();
  const { data: senderProfile } = useGetUserProfile(senderPrincipalStr);

  const getVideoId = (notif: Notification): bigint => {
    switch (notif.notificationType.__kind__) {
      case "like":
        return notif.notificationType.like.videoId;
      case "share":
        return notif.notificationType.share.videoId;
      case "reply":
        return notif.notificationType.reply.videoId;
      default:
        return BigInt(0);
    }
  };

  const getNotificationText = (senderUsername: string | null) => {
    const username = senderUsername || "Someone";
    switch (notification.notificationType.__kind__) {
      case "like":
        return { prefix: "", username, suffix: " liked your video." };
      case "share":
        return { prefix: "", username, suffix: " shared your video." };
      case "reply":
        return { prefix: "", username, suffix: " replied to your video." };
      default:
        return {
          prefix: "",
          username: "Someone",
          suffix: " sent you a notification.",
        };
    }
  };

  const videoId = getVideoId(notification);
  const text = getNotificationText(senderProfile?.username || null);

  const handleNotificationClick = () => {
    navigate({
      to: "/video/$videoId",
      params: { videoId: videoId.toString() },
    });
    onClose();
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (senderProfile?.username) {
      navigate({
        to: "/profile/$username",
        params: { username: senderProfile.username },
      });
      onClose();
    }
  };

  return (
    <button
      type="button"
      className="w-full text-left p-4 hover:bg-accent cursor-pointer transition-colors"
      onClick={handleNotificationClick}
    >
      <p className="text-sm">
        {text.prefix}
        <button
          type="button"
          className="font-semibold hover:underline cursor-pointer"
          onClick={handleUsernameClick}
        >
          {text.username}
        </button>
        {text.suffix}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(
          Number(notification.timestamp) / 1000000,
        ).toLocaleDateString()}
      </p>
    </button>
  );
}
