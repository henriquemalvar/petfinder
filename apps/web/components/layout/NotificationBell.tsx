"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import type { ApiNotification, NotificationsResponse } from "@/lib/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently ignore — usuário pode não estar logado
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleClick(notification: ApiNotification) {
    if (!notification.read) {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n,
        ),
      );
    }
    setOpen(false);
    router.push(`/pets/${notification.postId}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border px-4 py-3">
          <p className="font-semibold text-sm">Notificações</p>
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sem notificações
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-base">🐾</span>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
