'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MicrophoneIcon, StopIcon, PlayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
    onRecordingComplete?: (audioBlob: Blob) => void;
    maxDuration?: number;
}

export function VoiceRecorder({ onRecordingComplete, maxDuration = 300 }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string>('');
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);

                if (onRecordingComplete) {
                    onRecordingComplete(audioBlob);
                }

                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration((prev) => {
                    if (prev >= maxDuration) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

            toast.success('Recording started');
        } catch (error) {
            toast.error('Failed to access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            toast.success('Recording stopped');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Voice Recorder</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                        {!isRecording ? (
                            <Button
                                variant="primary"
                                onClick={startRecording}
                                leftIcon={<MicrophoneIcon className="h-5 w-5" />}
                                disabled={isRecording}
                            >
                                Start Recording
                            </Button>
                        ) : (
                            <Button
                                variant="danger"
                                onClick={stopRecording}
                                leftIcon={<StopIcon className="h-5 w-5" />}
                            >
                                Stop Recording
                            </Button>
                        )}
                    </div>

                    {isRecording && (
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <div className="h-3 w-3 bg-red-600 rounded-full animate-pulse" />
                                <span className="font-mono text-lg text-gray-900 dark:text-white">
                                    {formatTime(duration)}
                                </span>
                            </div>
                        </div>
                    )}

                    {audioURL && !isRecording && (
                        <div className="space-y-3">
                            <audio src={audioURL} controls className="w-full" />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAudioURL('');
                                        setDuration(0);
                                    }}
                                    className="flex-1"
                                >
                                    Clear
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={startRecording}
                                    className="flex-1"
                                >
                                    Record Again
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
