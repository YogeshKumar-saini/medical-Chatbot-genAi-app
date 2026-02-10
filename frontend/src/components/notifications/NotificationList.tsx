'use client';

import { useState, useEffect } from 'react';
import { notificationService, Notification } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check } from 'lucide-react';

export default function NotificationList() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifs = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifs();
        // Optional: Poll for new notifications every 60s
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bell size={18} className="text-gray-500" />
                    Notifications
                </h3>
                {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                    </span>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                ) : (
                    <div>
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex gap-3 ${!n.read ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                                    <span className="text-xs text-gray-400 mt-1 block">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                {!n.read && (
                                    <button
                                        onClick={() => handleMarkRead(n.id)}
                                        className="flex-shrink-0 text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors self-start"
                                        title="Mark as read"
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
