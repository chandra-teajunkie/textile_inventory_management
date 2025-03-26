import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import EditTaskModal from './editTask';
import { Toast } from 'primereact/toast';
import OverlayPopup from '../overlay/overlay';

const STATUS_COLOR_MAP = {
    'NOT STARTED': 'text-gray-700',
    'IN PROGRESS': 'text-orange-500',
    'COMPLETED': 'text-green-600',
};

export default function ViewTasksTab() {
    const toast = useRef(null);

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [editTask, setEditTask] = useState(null);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:3002/orders/');
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    };

    const fetchTasks = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:3002/tasks/?order_id=${orderId}`);
            const data = await response.json();
            setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOrderChange = (option) => {
        setSelectedOrder(option);
        fetchTasks(option.value);
    };

    const updateTaskInState = (updatedTask) => {
        setTasks((prev) => prev.map((t) => (t.task_id === updatedTask.task_id ? updatedTask : t)));
    };


    const popupOverlay = () => {
        setEditTask(null)
    }


    return (
        <div className="p-6" style={{ width: "-webkit-fill-available", height: "-webkit-fill-available" }}>
            <Toast ref={toast} position="top-right" className='toastPopUp' />

            <h2 className="text-xl font-semibold mb-4">Tasks</h2>

            <div className="mb-4 max-w-md" style={{ width: "-webkit-fill-available" }}>
                <Select
                    options={orders.map((order) => ({
                        label: `${order.customer_id} (${order.order_id})`,
                        value: order.order_id,
                        customer_id: order.customer_id,
                    }))}
                    onChange={handleOrderChange}
                    placeholder="Select an Order"
                />
            </div>

            {selectedOrder && (
                <table className="min-w-full border text-center" style={{ width: "-webkit-fill-available", height: "-webkit-fill-available" }}>
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-3 py-2">Task Name</th>
                            <th className="border px-3 py-2">Status</th>
                            <th className="border px-3 py-2">Dependencies</th>
                            <th className="border px-3 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.task_id}>
                                <td className="border px-3 py-2">{task.name}</td>
                                <td className={`border px-3 py-2 font-semibold ${STATUS_COLOR_MAP[task.status]}`}>{task.status}</td>
                                <td className="border px-3 py-2">
                                    {JSON.parse(task.dependencies || '[]')
                                        .map((id) => tasks.find((t) => t.task_id === id)?.name)
                                        .filter(Boolean)
                                        .join(', ') || '—'}
                                </td>
                                <td className="border px-3 py-2">
                                    <button
                                        className="bg-indigo-600 text-black px-3 py-1 rounded"
                                        onClick={() => setEditTask(task)}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {editTask && (
                <OverlayPopup
                    isExpanded={false}
                    // customToastRef={customToastCopyGraph}
                    customToastRefClassName={"toastPopUpCustomGraphCopy"}
                    closePopupOverlay={popupOverlay}
                    popupChild={<EditTaskModal
                        orderId={selectedOrder.order_id}
                        selectedOrder={selectedOrder}
                        // refreshOrders={fetchOrders()}
                        toast={toast}
                        task={editTask}
                        allTasks={tasks}
                        onClose={() => setEditTask(null)}
                        onUpdate={updateTaskInState}
                    />
                    } />

            )}
        </div>
    );
}