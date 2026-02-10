'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import {
    Users,
    MessageSquare,
    Activity,
    Shield,
    Clock,
    AlertCircle
} from 'lucide-react';
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface Stats {
    total_users: number;
    total_chat_sessions: number;
    active_chats_24h: number;
    system_health: string;
}

interface Log {
    timestamp: string;
    level: string;
    message: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const user = apiClient.getCurrentUser();
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/auth/login');
            return;
        }

        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            const [statsData, logsData] = await Promise.all([
                apiClient.getSystemStats(),
                apiClient.getSystemLogs()
            ]);

            setStats(statsData);
            setLogs(logsData || []);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const roleData = [
        { name: 'Patients', value: 400, color: '#3B82F6' },
        { name: 'Doctors', value: 300, color: '#10B981' },
        { name: 'Admins', value: 50, color: '#F59E0B' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Overview of system performance and user activity</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full text-green-700">
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">System Role: Super Admin</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        title="Total Users"
                        value={stats?.total_users || 0}
                        trend="+12% this week"
                        color="bg-blue-50"
                    />
                    <StatCard
                        icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
                        title="Total Sessions"
                        value={stats?.total_chat_sessions || 0}
                        trend="+5% yesterday"
                        color="bg-purple-50"
                    />
                    <StatCard
                        icon={<Activity className="h-6 w-6 text-green-600" />}
                        title="Active (24h)"
                        value={stats?.active_chats_24h || 0}
                        trend="Stable"
                        color="bg-green-50"
                    />
                    <StatCard
                        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                        title="System Health"
                        value={stats?.system_health || 'Unknown'}
                        trend="All systems go"
                        color="bg-red-50"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* User Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">User Distribution</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center flex-wrap gap-4 mt-4">
                                {roleData.map((role, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                                        <span className="text-sm text-gray-600">{role.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Activity Logs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity Logs</h3>
                        <div className="overflow-y-auto h-[300px] space-y-4 pr-2">
                            {logs.map((log, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-blue-500 bg-gray-50/30">
                                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{log.message}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${log.level === 'INFO' ? 'bg-blue-100 text-blue-700' :
                                                log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {log.level}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, trend, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${color}`}>
                    {icon}
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {trend}
                </span>
            </div>
            <div className="mt-4">
                <h4 className="text-sm text-gray-500 font-medium">{title}</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
}
