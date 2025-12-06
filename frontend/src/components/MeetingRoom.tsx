import {
    LiveKitRoom,
    LayoutContextProvider,
    useTracks,
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";
import { Track } from "livekit-client";
import { Loader2 } from "lucide-react";
import PreJoinScreen from "./meeting/PreJoinScreen";
import MeetingControls from "./meeting/MeetingControls";
import ChatSidePanel from "./meeting/ChatSidePanel";

interface MeetingRoomProps {
    chatId: string;
    token: string;
}

export default function MeetingRoom({ token }: MeetingRoomProps) {
    const [serverUrl, setServerUrl] = useState("");
    const [preJoinComplete, setPreJoinComplete] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (url) {
            setServerUrl(url);
        }
    }, []);

    if (!token || !serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 bg-neutral-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-neutral-400">Connecting to secure room...</p>
            </div>
        );
    }

    // Phase 1: Pre-Join Screen
    if (!preJoinComplete) {
        return <PreJoinScreen onJoin={() => setPreJoinComplete(true)} />;
    }

    // Phase 2: Active Meeting Room
    return (
        <LiveKitRoom
            video={true} // Default join with video
            audio={true} // Default join with audio
            token={token}
            serverUrl={serverUrl}
            data-lk-theme="default"
            style={{ height: "100dvh" }}
            className="bg-neutral-950 flex flex-col"
        >
            <LayoutContextProvider>
                <ActiveMeetingLayout
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                />
            </LayoutContextProvider>
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

function ActiveMeetingLayout({ isChatOpen, setIsChatOpen }: { isChatOpen: boolean, setIsChatOpen: (v: boolean) => void }) {
    const tracks = useTracks(
        [Track.Source.Camera, Track.Source.ScreenShare],
        { onlySubscribed: true },
    );

    return (
        <div className="flex flex-1 overflow-hidden relative">
            {/* Main Video Grid */}
            <div className={`flex-1 transition-all duration-300 relative ${isChatOpen ? 'mr-0' : 'mr-0'}`}>
                <div className="absolute inset-0 p-4">
                    <GridLayout tracks={tracks}>
                        <ParticipantTile />
                    </GridLayout>
                </div>

                {/* Floating Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <MeetingControls
                        onLeave={() => window.close()}
                        onToggleChat={() => setIsChatOpen(!isChatOpen)}
                        isChatOpen={isChatOpen}
                    />
                </div>
            </div>

            {/* Side Panel */}
            <ChatSidePanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
}
