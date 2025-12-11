import { apiClient } from '@/lib/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

export const notificationService = {
    async getNotifications(limit: number = 20, unreadOnly: boolean = false): Promise<Notification[]> {
        const response = await apiClient.client.get(
            `/api/v1/notifications/?limit=${limit}&unread_only=${unreadOnly}`
        );
        return response.data;
    },

    async markAsRead(id: string): Promise<void> {
        await apiClient.client.put(`/api/v1/notifications/${id}/read`);
    }
};
