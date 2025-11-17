import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  ref as dbRef,
  onValue,
  push,
  update,
  remove,
  serverTimestamp,
} from "firebase/database";

// Enhanced Notification types
export type NotificationType = "task" | "system" | "message" | "user_task";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  taskId?: string;
  createdByUserId?: string; // For user-created task notifications - who created the task
  createdByUserName?: string; // For user-created task notifications - name of who created the task
  createdAt: string;
  userId: string; // The user who receives the notification
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only subscribe to notifications if user is logged in
    if (!auth.currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = dbRef(db, `notifications/${auth.currentUser.uid}`);
    const unsub = onValue(notificationsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, n]: [string, any]) => ({
          id,
          ...n,
        }));
        // Sort by creation date, newest first
        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setNotifications(list);
        // Update unread count
        setUnreadCount(list.filter((n) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function createNotification(
    userId: string,
    payload: Omit<Notification, "id" | "createdAt" | "userId" | "read">
  ) {
    const notificationsRef = dbRef(db, `notifications/${userId}`);
    const item = {
      ...payload,
      read: false,
      createdAt: serverTimestamp(),
      userId,
    };
    await push(notificationsRef, item);
  }

  // New function specifically for user-created task notifications
  async function notifyAdminsAboutUserTask(
    adminUserIds: string[],
    taskData: {
      taskId: string;
      taskTitle: string;
      userId: string;
      userName: string;
    }
  ) {
    for (const adminId of adminUserIds) {
      await createNotification(adminId, {
        title: "New User-Created Task",
        message: `User ${taskData.userName} created a new task: "${taskData.taskTitle}" that requires your approval.`,
        type: "user_task",
        taskId: taskData.taskId,
        createdByUserId: taskData.userId,
        createdByUserName: taskData.userName,
      });
    }
  }

  // New function to get unread notifications by type
  function getUnreadNotificationsByType(type: NotificationType) {
    return notifications.filter(n => !n.read && n.type === type);
  }

  // New function to get notifications by type
  function getNotificationsByType(type: NotificationType) {
    return notifications.filter(n => n.type === type);
  }

  async function markAsRead(notificationId: string) {
    if (!auth.currentUser?.uid) return;
    const notificationRef = dbRef(
      db,
      `notifications/${auth.currentUser.uid}/${notificationId}`
    );
    await update(notificationRef, { read: true });
  }

  async function markAllAsRead() {
    if (!auth.currentUser?.uid) return;
    const updates = notifications
      .filter((n) => !n.read)
      .reduce((acc, n) => {
        acc[`notifications/${auth.currentUser!.uid}/${n.id}/read`] = true;
        return acc;
      }, {} as Record<string, boolean>);

    if (Object.keys(updates).length > 0) {
      await update(dbRef(db), updates);
    }
  }

  // New function to mark notifications as read by type
  async function markAsReadByType(type: NotificationType) {
    if (!auth.currentUser?.uid) return;
    const typeNotifications = notifications.filter(n => !n.read && n.type === type);
    
    const updates = typeNotifications.reduce((acc, n) => {
      acc[`notifications/${auth.currentUser!.uid}/${n.id}/read`] = true;
      return acc;
    }, {} as Record<string, boolean>);

    if (Object.keys(updates).length > 0) {
      await update(dbRef(db), updates);
    }
  }

  async function deleteNotification(notificationId: string) {
    if (!auth.currentUser?.uid) return;
    const notificationRef = dbRef(
      db,
      `notifications/${auth.currentUser.uid}/${notificationId}`
    );
    await remove(notificationRef);
  }

  // New function to delete notifications by type
  async function deleteNotificationsByType(type: NotificationType) {
    if (!auth.currentUser?.uid) return;
    const typeNotifications = notifications.filter(n => n.type === type);
    
    for (const notification of typeNotifications) {
      const notificationRef = dbRef(
        db,
        `notifications/${auth.currentUser.uid}/${notification.id}`
      );
      await remove(notificationRef);
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    createNotification,
    notifyAdminsAboutUserTask, // New function
    getUnreadNotificationsByType, // New function
    getNotificationsByType, // New function
    markAsRead,
    markAsReadByType, // New function
    markAllAsRead,
    deleteNotification,
    deleteNotificationsByType, // New function
  };
}