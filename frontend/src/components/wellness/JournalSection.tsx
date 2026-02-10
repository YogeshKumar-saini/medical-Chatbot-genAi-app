'use client';

import { useState, useEffect } from 'react';
import { wellnessService, JournalEntry } from '@/services/wellness';
import { format } from 'date-fns';
import { Trash2, Plus, X } from 'lucide-react';

export default function JournalSection() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchEntries = async () => {
        try {
            const data = await wellnessService.getJournalEntries();
            setEntries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        await wellnessService.deleteJournal(id);
        setEntries(entries.filter(e => e.id !== id));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Journal</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    <Plus size={16} /> New Entry
                </button>
            </div>

            {showForm && (
                <JournalForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchEntries();
                    }}
                />
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {loading ? (
                    <div className="text-center text-gray-400 py-8">Loading entries...</div>
                ) : entries.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-100 rounded-lg">
                        No journal entries yet. Write your first one!
                    </div>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                                    <span className="text-xs text-gray-500">{format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete entry"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                            {entry.tags && entry.tags.length > 0 && (
                                <div className="mt-3 flex gap-2 flex-wrap">
                                    {entry.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function JournalForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await wellnessService.createJournal({
                title,
                content,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-900">New Journal Entry</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            placeholder="Give your entry a title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            required
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full rounded-lg border-gray-300 border p-2 text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            placeholder="Write your thoughts..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            placeholder="work, gratitude, ideas"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                            {submitting ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
