// NotificationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/context/AuthContext";

interface NotificationData {
  id: number;
  type:
    | "user"
    | "broadcast"
    | "success"
    | "flagged"
    | "msgModeration"
    | "warning";
  title: string;
  content: string;
  isRead: boolean;
  link: string;
  createdAt: Date;
}

// Add ServerNotification interface to avoid 'any'
interface ServerNotification {
  NotificationID: number;
  NotificationType: string;
  EntityType: string;
  EntityID: number;
  Title: string;
  Message: string;
  CreatedAt: string;
  Metadata: string | null;
  IsRead: boolean;
  ReadAt: string | null;
}

interface NotificationContextType {
  showNotification: (data: Omit<NotificationData, "id" | "isRead">) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  notifications: NotificationData[];
  unreadCount: number;
  //fetchUnreadCount: () => Promise<void>;
  topUnreadNotifications: NotificationData[]; // NEW: Top 5 unread notifications
  fetchNotifications: () => Promise<void>; // NEW: Fetch all notifications
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  //const [unreadCount, setUnreadCount] = useState(0);
  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  // NEW: Top 3 unread notifications
  const topUnreadNotifications = useMemo(() => {
    return notifications
      .filter((notif) => !notif.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
  }, [notifications]);

  // Calculate unread count directly from notifications
  const unreadCount = useMemo(() => {
    return notifications.filter((notif) => !notif.isRead).length;
  }, [notifications]);

  // Add a new notification
  const showNotification = useCallback(
    (data: Omit<NotificationData, "id" | "isRead">) => {
      setNotifications((prev) => [
        {
          ...data,
          id: Date.now(),
          isRead: false,
        },
        ...prev,
      ]);
    },
    []
  );

  // NEW: Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.UserID) return;

    try {
      const response = await fetch(
        `${BASE}/api/Leader/${user.UserID}/notifications`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      // Map server notifications to client format
      // Use ServerNotification interface
      const mappedNotifications = data.map((n: ServerNotification) => ({
        id: n.NotificationID,
        type: mapNotificationType(n.NotificationType),
        title: n.Title,
        content: n.Message,
        isRead: n.IsRead,
        link: generateLink(n),
        createdAt: new Date(n.CreatedAt),
      }));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [BASE, user?.UserID]);

  // Add this to your notification mapping
  const generateLink = (notification: ServerNotification): string => {
    switch (notification.EntityType) {
      case "MESSAGE":
        return `/BroadCast`;
      case "USER":
        return `/user/${notification.EntityID}`;
      case "SYSTEM":
        return "/settings/notifications";
      default:
        return "#";
    }
  };

  // NEW: Map server notification type to client type
  const mapNotificationType = (
    type: string
  ):
    | "user"
    | "broadcast"
    | "success"
    | "flagged"
    | "msgModeration"
    | "warning" => {
    switch (type) {
      case "BROADCAST":
        return "broadcast";
      case "MODERATION_ACTION":
        return "msgModeration";
      case "MESSAGE_FLAGGED":
        return "flagged";
      case "SYSTEM_ALERT":
        return "broadcast";
      case "PERMISSION_CHANGE":
        return "user";
      case "USER_SLEEP":
        return "warning";
      case "USER_SLEEP_ADMIN":
        return "warning";
      default:
        return "broadcast";
    }
  };

  // Update markAsRead function
  const markAsRead = useCallback(async (id: number) => {
    try {
      // ... API call ...
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  // Update markAllAsRead function
  const markAllAsRead = useCallback(async () => {
    try {
      // ... API call ...
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user?.UserID) {
      fetchNotifications();
    }
  }, [user?.UserID, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        markAsRead,
        markAllAsRead,
        notifications,
        unreadCount,

        topUnreadNotifications, // NEW
        fetchNotifications, // NEW
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
