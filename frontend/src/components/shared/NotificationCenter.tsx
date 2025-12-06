'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    BellIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

interface NotificationCenterProps {
    notifications?: Notification[];
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
    onDelete?: (id: string) => void;
}

export function NotificationCenter({
    notifications = [],
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete
}: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<Notification[]>(notifications);

    useEffect(() => {
        setItems(notifications);
    }, [notifications]);

    const unreadCount = items.filter((n) => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
            case 'warning':
                return <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />;
            case 'error':
                return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
            default:
                return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
        }
    };

    const handleMarkAsRead = (id: string) => {
        setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
        if (onMarkAsRead) onMarkAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        setItems(items.map((n) => ({ ...n, read: true })));
        if (onMarkAllAsRead) onMarkAllAsRead();
    };

    const handleDelete = (id: string) => {
        setItems(items.filter((n) => n.id !== id));
        if (onDelete) onDelete(id);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-96 z-50">
                        <Card>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                                            Mark all read
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardContent padding="none">
                                <div className="max-h-96 overflow-y-auto">
                                    {items.length === 0 ? (
                                        <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                                            No notifications
                                        </div>
                                    ) : (
                                        items.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                                    {new Date(notification.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDelete(notification.id)}
                                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        {!notification.read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="mt-2"
                                                            >
                                                                Mark as read
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
