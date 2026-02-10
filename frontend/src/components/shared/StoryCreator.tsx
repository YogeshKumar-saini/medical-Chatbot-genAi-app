'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface StoryCreatorProps {
    onPublish?: (story: any) => void;
    onCancel?: () => void;
}

export function StoryCreator({ onPublish, onCancel }: StoryCreatorProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string>('');
    const [publishing, setPublishing] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': [], 'video/*': [] },
        maxSize: 10485760,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles[0]) {
                setMediaFile(acceptedFiles[0]);
                setMediaPreview(URL.createObjectURL(acceptedFiles[0]));
            }
        },
    });

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Please fill in title and content');
            return;
        }

        setPublishing(true);
        try {
            const storyData = {
                title,
                content,
                tags,
                media: mediaFile,
            };

            if (onPublish) {
                await onPublish(storyData);
            }

            toast.success('Story published successfully!');

            // Reset form
            setTitle('');
            setContent('');
            setTags([]);
            setMediaFile(null);
            setMediaPreview('');
        } catch (error) {
            toast.error('Failed to publish story');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Story</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Input
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your story a title..."
                    />

                    <Textarea
                        label="Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your story..."
                        rows={6}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Media (Optional)
                        </label>
                        {mediaPreview ? (
                            <div className="relative">
                                {mediaFile?.type.startsWith('image/') ? (
                                    <img src={mediaPreview} alt="Preview" className="w-full rounded-lg" />
                                ) : (
                                    <video src={mediaPreview} controls className="w-full rounded-lg" />
                                )}
                                <button
                                    onClick={() => {
                                        setMediaFile(null);
                                        setMediaPreview('');
                                    }}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                {...getRootProps()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-600"
                            >
                                <input {...getInputProps()} />
                                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Click or drag to upload image/video
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                placeholder="Add a tag..."
                            />
                            <Button variant="outline" onClick={addTag}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="info">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="ml-2">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} className="flex-1">
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            onClick={handlePublish}
                            isLoading={publishing}
                            className="flex-1"
                        >
                            Publish Story
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
