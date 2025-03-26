// src/components/TaskModal.jsx
import React, { useState } from 'react';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

export default function TaskModal({ orderId, onClose }) {
    const [taskName, setTaskName] = useState('');
    const [status, setStatus] = useState(STATUS_OPTIONS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!taskName) {
            alert('Please enter a task name');
            return;
        }

        const payload = {
            order_id: orderId,
            name: taskName,
            status,
        };

        try {
            setLoading(true);
            const response = await fetch(process.env.REACT_APP_GET_ALL_TASKS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('✅ Task created successfully!');
                onClose();
            } else {
                alert('❌ Failed to create task.');
            }
        } catch (error) {
            console.error(error);
            alert('❌ Error while creating task.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Create Task for Order</h2>

                <label className="block font-medium mb-1">Task Name</label>
                <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full border p-2 mb-4 rounded"
                />

                <label className="block font-medium mb-1">Status</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border p-2 mb-4 rounded"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-indigo-600 text-dark px-4 py-2 rounded"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
