'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    PaperAirplaneIcon,
    PhotoIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
    type: 'user' | 'ai';
    content: string;
    sources?: string[];
    timestamp: string;
}

export default function PatientChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChatHistory = async () => {
        try {
            const data = await apiClient.getChatHistory(50);
            if (data.messages) {
                setMessages(data.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: msg.timestamp || new Date().toISOString()
                })));
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !selectedImage) return;

        const userMessage: Message = {
            type: 'user',
            content: input,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let response: any;
            if (selectedImage) {
                response = await apiClient.analyzeImage(selectedImage, input || 'Analyze this image');
                setSelectedImage(null);
            } else {
                response = await apiClient.sendMessage(input);
            }

            const aiMessage: Message = {
                type: 'ai',
                content: response.response || response.analysis || response.answer || 'No response',
                sources: response.sources,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            toast.success('Image selected');
        }
    };

    const handleVoiceRecord = async () => {
        if (!isRecording) {
            // Start recording
            setIsRecording(true);
            toast.success('Recording started...');
            // TODO: Implement actual voice recording
        } else {
            // Stop recording
            setIsRecording(false);
            toast.success('Recording stopped');
            // TODO: Send audio to transcription API
        }
    };

    const handleTextToSpeech = async (text: string) => {
        try {
            const audioBlob = await apiClient.textToSpeech(text);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            toast.success('Playing audio...');
        } catch (error) {
            toast.error('Failed to play audio');
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear chat history?')) {
            try {
                await apiClient.clearChatHistory();
                setMessages([]);
                toast.success('Chat history cleared');
            } catch (error) {
                toast.error('Failed to clear history');
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>AI Medical Assistant</CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Ask me anything about your health
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearHistory}
                                leftIcon={<TrashIcon className="h-4 w-4" />}
                            >
                                Clear History
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent padding="md" className="flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No messages yet. Start a conversation!
                                    </p>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-4 ${message.type === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                        {message.sources && message.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                                <p className="text-xs opacity-75 mb-1">Sources:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {message.sources.map((source, i) => (
                                                        <Badge key={i} variant="info" size="sm">
                                                            {source}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {message.type === 'ai' && (
                                            <button
                                                onClick={() => handleTextToSpeech(message.content)}
                                                className="mt-2 text-xs opacity-75 hover:opacity-100 flex items-center gap-1"
                                            >
                                                <SpeakerWaveIcon className="h-3 w-3" />
                                                Listen
                                            </button>
                                        )}
                                        <p className="text-xs opacity-75 mt-2">
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                            <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>

                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        {selectedImage && (
                            <div className="mb-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <PhotoIcon className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                    {selectedImage.name}
                                </span>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="ml-auto text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />

                            <Button
                                variant="outline"
                                size="md"
                                onClick={() => fileInputRef.current?.click()}
                                leftIcon={<PhotoIcon className="h-5 w-5" />}
                            />

                            <Button
                                variant={isRecording ? 'danger' : 'outline'}
                                size="md"
                                onClick={handleVoiceRecord}
                                leftIcon={<MicrophoneIcon className="h-5 w-5" />}
                            />

                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Type your message... (Shift+Enter for new line)"
                                className="flex-1 min-h-[44px] max-h-32 resize-none"
                                rows={1}
                            />

                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleSend}
                                disabled={isLoading || (!input.trim() && !selectedImage)}
                                leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
