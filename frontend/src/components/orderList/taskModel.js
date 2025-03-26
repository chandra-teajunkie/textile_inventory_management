// src/components/TaskModal.jsx
import React, { useState } from 'react';

const STATUS_OPTIONS = ['NOT STARTED', 'IN PROGRESS', 'COMPLETED'];

export default function TaskModal({ orderId, onClose, selectedOrder }) {
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
            status: status,
        };

        try {
            setLoading(true);
            const response = await fetch(process.env.REACT_APP_POST_ALL_TASKS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            console.log(response)
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
        <div style={{ width: "-webkit-fill-available", height: "-webkit-fill-available" }} >
            <div className="fixed inset-0 bg-opacity-40 flex justify-center items-center z-50 p-6"
                style={{ height: "-webkit-fill-available" }}
            >
                <div className="bg-white p-6 rounded shadow-lg w-full max-w-md"
                    style={{
                        height: "-webkit-fill-available",
                        display: "flex",
                        padding: "2rem",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <h3 className="text-lg font-semibold mb-4">Create Task for Order : ({selectedOrder?.customer_id})</h3>

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
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-dark px-4 py-2 rounded me-3"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-700"
                        >
                            Cancel
                        </button>

                    </div>
                </div>
            </div>
        </div >
    );
}
