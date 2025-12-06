import {
    useLocalParticipant,
} from "@livekit/components-react";
import {
    Mic, MicOff, Video, VideoOff,
    MonitorUp, MessageSquare, Users,
    PhoneOff
} from "lucide-react";

interface MeetingControlsProps {
    onLeave: () => void;
    onToggleChat: () => void;
    isChatOpen: boolean;
}

export default function MeetingControls({ onLeave, onToggleChat, isChatOpen }: MeetingControlsProps) {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

    const toggleMicrophone = async () => {
        if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        }
    };

    const toggleCamera = async () => {
        if (localParticipant) {
            await localParticipant.setCameraEnabled(!isCameraEnabled);
        }
    };

    const toggleScreenShare = async () => {
        if (localParticipant) {
            await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
        }
    };

    return (
        <div className="flex items-center justify-center gap-4 px-6 py-4 bg-neutral-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-800 pointer-events-auto">
            {/* Audio Toggle */}
            <button
                onClick={toggleMicrophone}
                className={`p-3 rounded-full transition-colors ${isMicrophoneEnabled ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
                {isMicrophoneEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>

            {/* Video Toggle */}
            <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-colors ${isCameraEnabled ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
                {isCameraEnabled ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>

            {/* Screen Share */}
            <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-colors ${isScreenShareEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-neutral-700 hover:bg-neutral-600'}`}
            >
                <MonitorUp className="w-5 h-5 text-white" />
            </button>

            <div className="w-px h-8 bg-neutral-700 mx-2" />

            {/* Chat Toggle */}
            <button
                onClick={onToggleChat}
                className={`p-3 rounded-full transition-colors ${isChatOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-neutral-700 hover:bg-neutral-600'}`}
            >
                <MessageSquare className="w-5 h-5 text-white" />
            </button>

            {/* Participants (future) */}
            <button className="p-3 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                <Users className="w-5 h-5 text-white" />
            </button>

            <div className="w-px h-8 bg-neutral-700 mx-2" />

            {/* End Call */}
            <button
                onClick={onLeave}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors flex items-center"
            >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Call
            </button>
        </div>
    );
}
