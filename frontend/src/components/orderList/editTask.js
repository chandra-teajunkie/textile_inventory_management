import React, { useEffect, useState } from 'react';
import Select from 'react-select';

const STATUS_OPTIONS = [
    { label: 'NOT STARTED', value: 'NOT STARTED', color: 'gray' },
    { label: 'IN PROGRESS', value: 'IN PROGRESS', color: 'orange' },
    { label: 'COMPLETED', value: 'COMPLETED', color: 'green' },
];

export default function EditTaskModal({ task, allTasks, onClose, onUpdate, selectedOrder, toast }) {
    const [taskName, setTaskName] = useState(task.name);
    const [status, setStatus] = useState(task.status);
    const [dependencies, setDependencies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (task.dependencies) {
            try {
                const parsed = JSON.parse(task.dependencies);
                const mapped = parsed.map((id) => {
                    const t = allTasks.find((t) => t.task_id === id);
                    return t ? { label: t.name, value: t.task_id } : null;
                }).filter(Boolean);
                setDependencies(mapped);
            } catch (e) {
                console.error('Error parsing dependencies:', e);
                setDependencies([]);
            }
        }
    }, [task, allTasks]);

    const handleSubmit = async () => {
        const payload = {
            name: taskName,
            status,
            dependencies: dependencies.map((d) => d.value),
        };

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3002/tasks/${task.task_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const updated = await response.json();
                onUpdate(updated);
                toast.current.show({ severity: 'success', summary: 'Updated', detail: 'Task updated successfully!', life: 1000 });
                onClose();
            } else {
                // alert('Failed to update task');
                toast.current.show({ severity: 'error', summary: 'Error', detail: "Failed to update task", life: 1000 });

            }
        } catch (error) {
            console.error('Update error:', error);
            // alert('Error updating task');
            toast.current.show({ severity: 'error', summary: 'Error', detail: "Failed while updating task", life: 1000 });

        } finally {
            setLoading(false);
        }
    };

    const availableDeps = allTasks.filter((t) => t.task_id !== task.task_id);

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
                    <h3 className="text-lg font-semibold mb-4">Edit Task ({selectedOrder?.customer_id} : {task?.name})</h3>

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
                            <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <label className="block font-medium mb-1">Dependens On</label>
                    <Select
                        isMulti
                        options={availableDeps.map((t) => ({ label: t.name, value: t.task_id }))}
                        value={dependencies}
                        onChange={setDependencies}
                        className="mb-4"
                    />

                    <div className="flex justify-end gap-2">
                       
                        <button
                            className="bg-indigo-600 text-black px-4 py-2 rounded me-3"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Task'}
                        </button>

                        <button
                            className="px-4 py-2 rounded text-gray-700 bg-indigo-600 "
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}
