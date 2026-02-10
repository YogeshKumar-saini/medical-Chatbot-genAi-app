'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TherapistChatHistoryPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const data = await apiClient.getDoctorLinks();
            setPatients(data.links?.filter((l: any) => l.status === 'ACCEPTED') || []);
        } catch (error) {
            toast.error('Failed to load patients');
        }
    };

    const loadChatHistory = async (patientId: string) => {
        try {
            setSelectedPatient(patientId);
            // TODO: Implement getPatientChatHistory API
            setMessages([
                { id: '1', content: 'I have been feeling anxious lately', type: 'user', timestamp: '2024-01-15T10:30:00' },
                { id: '2', content: 'Can you tell me more about when you feel most anxious?', type: 'ai', timestamp: '2024-01-15T10:31:00' },
            ]);
        } catch (error) {
            toast.error('Failed to load chat history');
        }
    };

    const filteredPatients = patients.filter(p =>
        p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Chat History</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">View patient conversations with AI assistant</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input placeholder="Search patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-4" />
                            <div className="space-y-2">
                                {filteredPatients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => loadChatHistory(patient.patient_id)}
                                        className={`w-full p-3 rounded-lg text-left transition-colors ${selectedPatient === patient.patient_id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600'
                                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white">{patient.patient_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{patient.patient_email}</p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Chat Messages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedPatient ? (
                                <div className="text-center py-12">
                                    <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Select a patient to view chat history</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-4 ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                }`}>
                                                <p>{msg.content}</p>
                                                <p className="text-xs opacity-75 mt-2">{new Date(msg.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
