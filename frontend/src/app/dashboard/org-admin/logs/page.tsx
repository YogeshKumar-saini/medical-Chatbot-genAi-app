'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrgAdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await apiClient.getSystemLogs();
                // API returns { logs: [...] } or just [...] depending on implementation?
                // Backend get_system_logs returns list directly now based on my fix? 
                // Wait, backend `get_system_logs` (the new one I saw in admin routes) returns a list `return logs`.
                // The OLD `analytics/routes.py` `get_system_logs` returned `{ logs: [] }`.
                // I should check which endpoint I am hitting. 
                // api.ts calls `/api/v1/admin/logs/system` -> this is the new one in `admin/routes.py`.
                // It returns a LIST.
                setLogs(Array.isArray(data) ? data : data.logs || []);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load logs');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        System Logs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View recent system activities and events.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Level
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Message
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                Loading logs...
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                No logs found
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                                                            log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                        }`}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                    {log.message}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
