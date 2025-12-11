'use client';

import React, { useState, useRef } from 'react';
import { XMarkIcon, PhotoIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateStoryModal({ isOpen, onClose, onSuccess }: CreateStoryModalProps) {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        try {
            // 1. Upload Media
            const uploadRes = await apiClient.uploadMedia(file);
            const mediaUrl = uploadRes.url; // Assuming backend returns { url: ... }

            // 2. Create Story
            await apiClient.createStory({
                media_url: mediaUrl,
                media_type: file.type.startsWith('video') ? 'video' : 'image',
                caption: caption || title // Fallback if backend requires caption
            });

            toast.success('Story created successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create story');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Create New Story</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* File Upload Preview */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        {file ? (
                            file.type.startsWith('image') ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    className="w-full h-full object-cover rounded-xl"
                                    alt="Preview"
                                />
                            ) : (
                                <div className="text-center">
                                    <PhotoIcon className="h-12 w-12 text-blue-500 mx-auto" />
                                    <p className="text-sm text-gray-600 mt-2">{file.name}</p>
                                </div>
                            )
                        ) : (
                            <>
                                <PhotoIcon className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Click to upload photo or video</p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    <Input
                        placeholder="Story Title (internal use)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />

                    <textarea
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none text-sm"
                        rows={3}
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={loading}
                        disabled={!file}
                        leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
                    >
                        Share Story
                    </Button>
                </form>
            </div>
        </div>
    );
}
