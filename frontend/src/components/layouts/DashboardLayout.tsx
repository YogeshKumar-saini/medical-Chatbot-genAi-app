'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
    HomeIcon,
    UsersIcon,
    CalendarIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    BellIcon,
    MoonIcon,
    SunIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    BookOpenIcon,
    HeartIcon,
} from '@heroicons/react/24/outline';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore, useThemeStore, useNotificationStore, UserRole } from '@/lib/store';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
    badge?: number;
}

const navigationItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['SUPER_ADMIN', 'GEN_ADMIN', 'ORG_ADMIN', 'THERAPIST', 'PATIENT'] },

    // Super Admin
    { name: 'Organizations', href: '/dashboard/super-admin/organizations', icon: BuildingOfficeIcon, roles: ['SUPER_ADMIN'] },
    { name: 'Users', href: '/dashboard/super-admin/users', icon: UsersIcon, roles: ['SUPER_ADMIN', 'GEN_ADMIN', 'ORG_ADMIN'] },
    { name: 'System Analytics', href: '/dashboard/super-admin/analytics', icon: ChartBarIcon, roles: ['SUPER_ADMIN'] },

    // Therapist
    { name: 'Patients', href: '/dashboard/therapist/patients', icon: UsersIcon, roles: ['THERAPIST'] },
    { name: 'Appointments', href: '/dashboard/therapist/appointments', icon: CalendarIcon, roles: ['THERAPIST'] },
    { name: 'Prescriptions', href: '/dashboard/therapist/prescriptions', icon: DocumentTextIcon, roles: ['THERAPIST'] },
    { name: 'Library', href: '/dashboard/therapist/library', icon: BookOpenIcon, roles: ['THERAPIST'] },
    { name: 'Analytics', href: '/dashboard/therapist/analytics', icon: ChartBarIcon, roles: ['THERAPIST'] },

    // Patient
    { name: 'Chat', href: '/dashboard/patient/chat', icon: ChatBubbleLeftRightIcon, roles: ['PATIENT'] },
    { name: 'Doctors', href: '/dashboard/patient/doctors', icon: UsersIcon, roles: ['PATIENT'] },
    { name: 'Appointments', href: '/dashboard/patient/appointments', icon: CalendarIcon, roles: ['PATIENT'] },
    { name: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: DocumentTextIcon, roles: ['PATIENT'] },
    { name: 'Community', href: '/dashboard/patient/community', icon: UserGroupIcon, roles: ['PATIENT'] },
    { name: 'Library', href: '/dashboard/patient/library', icon: BookOpenIcon, roles: ['PATIENT'] },
    { name: 'Wellness', href: '/dashboard/patient/wellness', icon: HeartIcon, roles: ['PATIENT'] },

    // Shared / Generic
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, roles: ['SUPER_ADMIN', 'GEN_ADMIN', 'ORG_ADMIN', 'THERAPIST', 'PATIENT'] },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const { unreadCount } = useNotificationStore();

    useEffect(() => {
        // Apply dark mode class to html element
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    // Filter navigation items based on user role
    const filteredNavItems = navigationItems.filter((item) =>
        user?.role ? item.roles.includes(user.role) : false
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                MediCare
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="flex-1">{item.name}</span>
                                    {item.badge && (
                                        <Badge variant="danger" size="sm">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User profile */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={user?.avatarUrl}
                                fallback={user?.name || user?.email || '?'}
                                size="md"
                                status="online"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.name || user?.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.role?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    {/* Breadcrumbs */}
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {pathname.split('/').filter(Boolean).join(' / ')}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isDarkMode ? (
                                <SunIcon className="h-5 w-5" />
                            ) : (
                                <MoonIcon className="h-5 w-5" />
                            )}
                        </button>

                        {/* Notifications */}
                        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <BellIcon className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                            )}
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
};
