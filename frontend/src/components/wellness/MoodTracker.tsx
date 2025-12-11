'use client';

import { useState, useEffect } from 'react';
import { wellnessService, MoodEntry } from '@/services/wellness';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const MOODS = ['HAPPY', 'EXCITED', 'NEUTRAL', 'TIRED', 'SAD', 'ANXIOUS', 'ANGRY'];

export default function MoodTracker() {
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMood, setSelectedMood] = useState('HAPPY');
    const [intensity, setIntensity] = useState(5);
    const [note, setNote] = useState('');

    const fetchMoods = async () => {
        try {
            const data = await wellnessService.getMoodHistory();
            setMoods(data.reverse()); // Show oldest to newest
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMoods();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await wellnessService.logMood({ mood: selectedMood, intensity, note });
            setNote('');
            fetchMoods();
        } catch (error) {
            console.error(error);
        }
    };

    const chartData = moods.map(m => ({
        date: format(new Date(m.created_at), 'MM/dd'),
        intensity: m.intensity,
        mood: m.mood
    }));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Mood Tracker</h2>

            <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Mood</label>
                    <select
                        value={selectedMood}
                        onChange={(e) => setSelectedMood(e.target.value)}
                        className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                        {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intensity (1-10)</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full rounded-lg border-gray-300 border p-2 text-sm text-black"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-lg border-gray-300 border p-2 text-sm text-black"
                        placeholder="How are you feeling?"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium h-[38px]"
                >
                    Log Mood
                </button>
            </form>

            <div className="h-64 w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
                ) : moods.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                            <YAxis domain={[0, 10]} stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="intensity"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#2563eb' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">No mood data yet</div>
                )}
            </div>
        </div>
    );
}
