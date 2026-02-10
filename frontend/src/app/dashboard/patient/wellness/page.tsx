import MoodTracker from '@/components/wellness/MoodTracker';
import JournalSection from '@/components/wellness/JournalSection';

export default function WellnessPage() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Wellness Center</h1>
                <p className="text-gray-600 mt-2">Track your mood and journal your daily thoughts.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <MoodTracker />
                </div>
                <div className="h-[800px]">
                    <JournalSection />
                </div>
            </div>
        </div>
    );
}
