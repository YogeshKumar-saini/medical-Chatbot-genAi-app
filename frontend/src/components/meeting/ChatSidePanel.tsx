import { Chat } from "@livekit/components-react";
import { X } from "lucide-react";

interface ChatSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatSidePanel({ isOpen, onClose }: ChatSidePanelProps) {
    if (!isOpen) return null;

    return (
        <div className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-xl z-10 transition-transform">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">In-Call Messages</h3>
                <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-hidden" data-lk-theme="default">
                <Chat />
            </div>
        </div>
    );
}
