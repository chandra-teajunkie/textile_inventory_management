import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const STATUS_OPTIONS = ['NOT STARTED', 'IN PROGRESS', 'COMPLETED'];

export default function TaskModal({ orderId, onClose, selectedOrder, toast }) {
    const [taskName, setTaskName] = useState('');
    const [status, setStatus] = useState(STATUS_OPTIONS[0]);
    const [loading, setLoading] = useState(false);
    const [allTasks, setAllTasks] = useState([]);
    const [dependencies, setDependencies] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${orderId}`);
                const data = await response.json();
                setAllTasks(data);
            } catch (err) {
                console.error('Error fetching tasks for dependency dropdown:', err);
            }
        };
        fetchTasks();
    }, [orderId]);

    const handleSubmit = async () => {
        if (!taskName) {
            alert('Please enter a task name');
            return;
        }

        const payload = {
            order_id: orderId,
            name: taskName,
            status: status,
            dependencies: dependencies.map((d) => d.value),
        };

        try {
            setLoading(true);
            const response = await fetch(process.env.REACT_APP_POST_ALL_TASKS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Task created successfully!', life: 1500 });
                onClose();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: "Failed to create task", life: 1500 });
            }
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: "Failed while creating task", life: 1500 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: "-webkit-fill-available", height: "-webkit-fill-available" }}>
            <div className="fixed inset-0 bg-opacity-40 flex justify-center items-center z-50 p-6"
                style={{ height: "-webkit-fill-available" }}>
                <div className="bg-white p-6 rounded shadow-lg w-full max-w-md"
                    style={{
                        height: "-webkit-fill-available",
                        display: "flex",
                        padding: "2rem",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}>

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

                    <label className="block font-medium mb-1">Dependens On</label>
                    <Select
                        isMulti
                        className="mb-4"
                        options={allTasks.map((t) => ({ label: t.name, value: t.task_id }))}
                        value={dependencies}
                        onChange={setDependencies}
                    />

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
                            className="px-4 py-2 rounded text-gray-700 bg-indigo-600"
                        >
                            Cancel
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}