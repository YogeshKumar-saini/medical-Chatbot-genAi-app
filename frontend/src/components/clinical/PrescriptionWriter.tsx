"use client";

import { useState } from 'react';
import { Plus, Trash2, Send, Pill } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PrescriptionItem {
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface PrescriptionWriterProps {
    patientId: string;
    onSuccess?: () => void;
}

export default function PrescriptionWriter({ patientId, onSuccess }: PrescriptionWriterProps) {
    const [items, setItems] = useState<PrescriptionItem[]>([
        { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleAddItem = () => {
        setItems([...items, { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleChange = (index: number, field: keyof PrescriptionItem, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            // Validation
            if (items.some(i => !i.medication_name || !i.dosage)) {
                throw new Error("Please fill in at least medication name and dosage for all items.");
            }

            await apiClient.createRx({
                patient_id: patientId,
                items: items,
                notes: notes
            });

            // Reset
            setItems([{ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
            setNotes('');
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create prescription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Write Prescription</h3>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative group transition-all hover:border-blue-200 hover:shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-4">
                                <input
                                    type="text"
                                    placeholder="Medication Name"
                                    value={item.medication_name}
                                    onChange={(e) => handleChange(index, 'medication_name', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Dosage (e.g. 500mg)"
                                    value={item.dosage}
                                    onChange={(e) => handleChange(index, 'dosage', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div className="lg:col-span-3">
                                <input
                                    type="text"
                                    placeholder="Frequency (e.g. 2x Daily)"
                                    value={item.frequency}
                                    onChange={(e) => handleChange(index, 'frequency', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div className="lg:col-span-3">
                                <input
                                    type="text"
                                    placeholder="Duration (e.g. 7 days)"
                                    value={item.duration}
                                    onChange={(e) => handleChange(index, 'duration', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div className="lg:col-span-12">
                                <input
                                    type="text"
                                    placeholder="Special Instructions (e.g. Take with food)"
                                    value={item.instructions}
                                    onChange={(e) => handleChange(index, 'instructions', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-gray-600"
                                />
                            </div>
                        </div>

                        {items.length > 1 && (
                            <button
                                onClick={() => handleRemoveItem(index)}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-3">
                <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                >
                    <Plus className="w-4 h-4" />
                    Add Medication
                </button>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
                <textarea
                    placeholder="Additional Notes for Patient..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm mb-4"
                    rows={3}
                />

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? 'Processing...' : (
                        <>
                            <Send className="w-4 h-4" />
                            Issue Prescription
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
