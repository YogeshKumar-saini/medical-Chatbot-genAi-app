import { apiClient } from '@/lib/api';

export interface MoodEntry {
    id: string;
    mood: string;
    intensity: number;
    note?: string;
    created_at: string;
}

export interface JournalEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
    mood?: string;
    created_at: string;
}

export const wellnessService = {
    async logMood(data: { mood: string; intensity: number; note?: string }): Promise<MoodEntry> {
        const response = await apiClient.client.post('/api/v1/wellness/mood', data);
        return response.data;
    },

    async getMoodHistory(limit: number = 30): Promise<MoodEntry[]> {
        const response = await apiClient.client.get(`/api/v1/wellness/mood/history?limit=${limit}`);
        return response.data;
    },

    async createJournal(data: { title: string; content: string; tags?: string[] }): Promise<JournalEntry> {
        const response = await apiClient.client.post('/api/v1/wellness/journal', data);
        return response.data;
    },

    async getJournalEntries(limit: number = 20): Promise<JournalEntry[]> {
        const response = await apiClient.client.get(`/api/v1/wellness/journal?limit=${limit}`);
        return response.data;
    },

    async deleteJournal(id: string): Promise<void> {
        await apiClient.client.delete(`/api/v1/wellness/journal/${id}`);
    }
};
