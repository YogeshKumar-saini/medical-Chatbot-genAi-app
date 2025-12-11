'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PaperAirplaneIcon, PhotoIcon, ArrowLeftIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users } from 'lucide-react';
import { format } from 'date-fns';

interface GroupMessage {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string; // Assuming API returns this, otherwise might need profile fetch
    timestamp: string;
    type: string;
    media_url?: string;
    reactions?: Record<string, number>;
}

export default function GroupChatPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = use(params);
    const router = useRouter();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [groupName, setGroupName] = useState('Group Chat');
    const [memberCount, setMemberCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = apiClient.getCurrentUser();
        // We might need the full user ID for comparison, the generic helper gives minimal info.
        // Let's assume we can get it or rely on sender_name logic for now if ID is missing.
        // Better: Fetch full profile to get ID.
        apiClient.getProfile('me').then(p => setCurrentUser(p)).catch(() => { });

        loadGroupDetails();
        loadMessages();

        // Poll for new messages every 5 seconds
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadGroupDetails = async () => {
        try {
            const data = await apiClient.getGroupDetails(groupId);
            setGroupName(data.name);
            setMemberCount(data.member_count);
        } catch (error) {
            console.error('Failed to load group details');
        }
    };

    const loadMessages = async () => {
        try {
            const data = await apiClient.getGroupMessages(groupId, 1, 50);
            // Assuming data.messages is the array and they are sorted or we sort them
            const sorted = (data.messages || []).sort((a: any, b: any) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setMessages(sorted);
            if (loading) setLoading(false);
        } catch (error) {
            console.error('Failed to load messages');
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        setSending(true);
        try {
            await apiClient.sendGroupMessage(groupId, {
                content: input,
                type: 'text'
            });
            setInput('');
            loadMessages(); // Refresh immediately
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {groupName}
                            </h1>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {memberCount} members
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = currentUser && (msg.sender_id === currentUser.id || msg.sender_name === currentUser.name);
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            {!isMe && <span className="text-xs font-semibold text-gray-600">{msg.sender_name}</span>}
                                            <span className="text-[10px] text-gray-400">
                                                {format(new Date(msg.timestamp), 'h:mm a')}
                                            </span>
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${isMe
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4 shrink-0">
                    <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="pr-12"
                                disabled={sending}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <FaceSmileIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            size="md"
                            leftIcon={sending ? undefined : <PaperAirplaneIcon className="h-4 w-4" />}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
