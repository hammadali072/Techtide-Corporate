import React from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { FaBell } from 'react-icons/fa';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export const NotificationMenu = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  if (loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <FaBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-3 ${
                !notification.read ? "bg-gray-50" : ""
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between w-full text-xs text-gray-500">
                <span>
                  {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                </span>
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};