import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'SUPER_ADMIN' | 'GEN_ADMIN' | 'ORG_ADMIN' | 'THERAPIST' | 'PATIENT';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId?: string;
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
}

interface ThemeState {
    isDarkMode: boolean;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

interface NotificationState {
    unreadCount: number;
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
}

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

// Auth Store
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user, token) => {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                set({ user, token, isAuthenticated: true });
            },
            clearAuth: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('username');
                localStorage.removeItem('role');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

// Theme Store
export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: true,
            toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setTheme: (isDark) => set({ isDarkMode: isDark }),
        }),
        {
            name: 'theme-storage',
        }
    )
);

// Notification Store
export const useNotificationStore = create<NotificationState>((set) => ({
    unreadCount: 0,
    notifications: [],
    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        })),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),
    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
