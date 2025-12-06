"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MeetingRoom from "@/components/MeetingRoom";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function MeetingPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const joinMeeting = async () => {
            try {
                const data = await apiClient.joinAppointment(id);
                if (data && data.token) {
                    setToken(data.token);
                } else {
                    toast.error("Failed to join meeting: Invalid token");
                    router.push("/dashboard");
                }
            } catch (error: any) {
                console.error("Error joining meeting:", error);
                toast.error("Failed to join meeting. Please try again.");
                // router.push("/dashboard"); // Optional: redirect back on error
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            joinMeeting();
        }
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900">Joining Meeting...</h2>
                    <p className="text-gray-500">Please wait while we connect you.</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Failed</h2>
                    <p className="text-gray-600 mb-4">
                        We couldn't connect you to the meeting. This might be due to an invalid link or network issues.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-black">
            <MeetingRoom chatId={id} token={token} />
        </div>
    );
}
