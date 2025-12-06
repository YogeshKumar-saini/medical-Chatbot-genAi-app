'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title?: string;
    uploadedAt: string;
}

interface MediaGalleryProps {
    items: MediaItem[];
    onDelete?: (id: string) => void;
}

export function MediaGallery({ items, onDelete }: MediaGalleryProps) {
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

    const handleDelete = (id: string) => {
        if (onDelete) {
            onDelete(id);
        }
        if (selectedItem?.id === id) {
            setSelectedItem(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Media Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No media files yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <VideoCameraIcon className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.id);
                                            }}
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <Badge variant={item.type === 'image' ? 'info' : 'success'} size="sm">
                                            {item.type}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedItem(null)}
                >
                    <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{selectedItem.title || 'Media Preview'}</CardTitle>
                                    <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-gray-700">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedItem.type === 'image' ? (
                                    <img src={selectedItem.url} alt={selectedItem.title} className="w-full rounded-lg" />
                                ) : (
                                    <video src={selectedItem.url} controls className="w-full rounded-lg" />
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                                    Uploaded: {new Date(selectedItem.uploadedAt).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
