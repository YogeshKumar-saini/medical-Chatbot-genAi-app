"use client";

import { useState, useEffect } from 'react';
import { Send, FileText, Lock, Globe } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Note {
    id: string;
    content: string;
    note_type: string;
    is_private: boolean;
    doctor_name: string;
    created_at: string;
}

interface ClinicalNotesProps {
    patientId: string;
}

export default function ClinicalNotes({ patientId }: ClinicalNotesProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState('GENERAL');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchNotes = async () => {
        try {
            const data = await apiClient.getClinicalNotes(patientId);
            setNotes(data || []);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (patientId) fetchNotes();
    }, [patientId]);

    const handleSubmit = async () => {
        if (!newNote.trim()) return;

        try {
            setLoading(true);
            await apiClient.createClinicalNote({
                patient_id: patientId,
                content: newNote,
                note_type: noteType,
                is_private: isPrivate
            });

            setNewNote('');
            fetchNotes(); // Refresh list
        } catch (error) {
            console.error("Failed to create note:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Note */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    New Clinical Note
                </h3>

                <div className="space-y-4">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter clinical observations..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 min-h-[120px]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <select
                                value={noteType}
                                onChange={(e) => setNoteType(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                            >
                                <option value="GENERAL">General Note</option>
                                <option value="SOAP">SOAP Note</option>
                                <option value="PRESCRIPTION">Prescription Note</option>
                            </select>

                            <button
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${isPrivate
                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                {isPrivate ? 'Private Note' : 'Shared with Patient'}
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !newNote.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Note List */}
            <div className="space-y-4">
                {fetching ? (
                    <div className="text-center py-8 text-gray-500">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        No clinical notes yet
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${note.note_type === 'SOAP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        <span className="text-xs font-bold px-1">{note.note_type}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        by <span className="font-medium text-gray-900">{note.doctor_name}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    {note.is_private && <Lock className="w-3 h-3 text-amber-500" />}
                                    {new Date(note.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
