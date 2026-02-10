import NotificationList from '@/components/notifications/NotificationList';

export default function NotificationsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            </header>
            <NotificationList />
        </div>
    );
}
