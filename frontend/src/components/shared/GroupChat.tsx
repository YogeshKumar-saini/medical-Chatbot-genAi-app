'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';

interface GroupChatProps {
    groupId: string;
    userId: string;
    userName: string;
}

export function GroupChat({ groupId, userId, userName }: GroupChatProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected] = useState(false); // TODO: Implement WebSocket connection

    useEffect(() => {
        // TODO: Implement group chat with WebSocket when socket is exposed
        // For now, load from API
        const loadMessages = async () => {
            try {
                // Load group messages from API
            } catch (error) {
                console.error('Failed to load messages');
            }
        };
        loadMessages();
    }, [groupId]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        // TODO: Send via WebSocket when available
        const msg = {
            user_id: userId,
            user_name: userName,
            message: newMessage,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Group Chat</CardTitle>
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.user_id === userId ? 'flex-row-reverse' : ''}`}>
                                <Avatar fallback={msg.user_name?.[0] || '?'} size="sm" />
                                <div className={`flex-1 ${msg.user_id === userId ? 'text-right' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{msg.user_name}</span>
                                        <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className={`mt-1 inline-block px-4 py-2 rounded-lg ${msg.user_id === userId
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                        }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            disabled={!isConnected}
                        />
                        <Button
                            variant="primary"
                            onClick={handleSendMessage}
                            disabled={!isConnected || !newMessage.trim()}
                            leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
