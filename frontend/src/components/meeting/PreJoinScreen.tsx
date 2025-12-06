import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Mic, Video, VideoOff, Settings, Loader2
} from 'lucide-react';

interface PreJoinScreenProps {
    onJoin: () => void;
    isLoading?: boolean;
}

export default function PreJoinScreen({ onJoin, isLoading }: PreJoinScreenProps) {
    // We need to manage local tracks manually for preview if we want full control, 
    // but LiveKit's PreJoin component is easier. 
    // However, for "Professional UI", let's build a custom one using their hooks or just a simple preview.

    // Actually, @livekit/components-react provides a PreJoin component, but let's build custom 
    // to match our "Google Meet" aesthetic exactly.

    // For simplicity in this iteration, we'll assume the user grants permissions 
    // and we show a preview after they click "Join" or we can do it here.
    // A true Pre-Join screen requires creating local tracks *before* joining the room.

    // Let's use a simpler approach first: Just a polished UI that asks the user to join.
    // Handling local tracks outside the Room context requires `createLocalVideoTrack`.

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let mounted = true;
        let localStream: MediaStream | null = null;

        async function enableCamera() {
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStream = userStream;
                if (mounted) {
                    setStream(userStream);
                }
            } catch (err) {
                if (mounted) {
                    setError("Camera/Mic access denied or not available.");
                    console.error(err);
                }
            }
        }

        enableCamera();

        return () => {
            mounted = false;
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Run once on mount

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Preview Area */}
                <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-700 flex items-center justify-center group">
                    {stream ? (
                        <video
                            ref={(node) => {
                                if (node && stream) node.srcObject = stream;
                            }}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-800">
                            <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
                                <VideoOff className="w-8 h-8" />
                            </div>
                            <p>{error || "Starting camera..."}</p>
                        </div>
                    )}

                    {/* Overlay Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                        <button className="p-3 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                            <Video className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Join Controls */}
                <div className="flex flex-col items-center space-y-6 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Ready to join?</h1>
                        <p className="text-neutral-400">Dr. Smith is waiting for you.</p>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <Button
                            size="lg"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-6 text-lg shadow-lg shadow-blue-900/20"
                            onClick={() => {
                                // Stop preview tracks to release device for LiveKit
                                if (stream) {
                                    stream.getTracks().forEach(track => track.stop());
                                }
                                onJoin();
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
                            ) : (
                                "Join Now"
                            )}
                        </Button>

                        <div className="flex justify-between items-center text-sm text-neutral-500 px-2">
                            <button className="flex items-center hover:text-neutral-300">
                                <Settings className="w-4 h-4 mr-1" /> Check Audio/Video
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
