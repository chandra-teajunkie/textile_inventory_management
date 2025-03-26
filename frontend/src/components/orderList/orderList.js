import React, { useEffect, useState } from 'react';
import TaskModal from './taskModel';
import OverlayPopup from '../overlay/overlay';

export default function OrderList() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [taskMap, setTaskMap] = useState({});
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:3002/orders/');
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    };

    const fetchTasksForOrder = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:3002/tasks/?order_id=${orderId}`);
            const data = await response.json();
            setTaskMap((prev) => ({ ...prev, [orderId]: data }));
        } catch (err) {
            console.error(`Failed to fetch tasks for order ${orderId}:`, err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const toggleTaskList = (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(orderId);
            if (!taskMap[orderId]) {
                fetchTasksForOrder(orderId);
            }
        }
    };


    const popupOverlay = () => {
        setShowModal(false)
    }


    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Orders</h2>

            <div className="overflow-x-auto">
                <table className="min-w-full border shadow-sm" style={{ width: "-webkit-fill-available" }}>
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-4 py-2 text-center">Order ID</th>
                            <th className="border px-4 py-2 text-center">Type</th>
                            <th className="border px-4 py-2 text-center">Customer</th>
                            <th className="border px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <React.Fragment key={order.order_id}>
                                <tr>
                                    <td className="border px-4 py-2 text-center">{order.order_id}</td>
                                    <td className="border px-4 py-2 text-center">{order.types}</td>
                                    <td className="border px-4 py-2 text-center">{order.customer_id}</td>
                                    <td className="border px-4 py-2 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                className="bg-indigo-600 text-black px-3 py-1 rounded me-3"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Create Task
                                            </button>
                                            <button
                                                className="bg-gray-500 text-black px-3 py-1 rounded"
                                                onClick={() => toggleTaskList(order.order_id)}
                                            >
                                                {expandedOrderId === order.order_id ? 'Hide Tasks' : 'Show Tasks'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedOrderId === order.order_id && (
                                    <tr>
                                        <td colSpan="4" className="border px-4 py-2 bg-gray-50">
                                            <ul className="list-disc pl-6">
                                                {(taskMap[order.order_id] || []).map((task) => (
                                                    <li key={task.task_id}>
                                                        <strong>{task.name}</strong> — <em>{task.status}</em>
                                                    </li>
                                                ))}
                                                {taskMap[order.order_id]?.length === 0 && (
                                                    <li className="text-gray-500">No tasks available for this order.</li>
                                                )}
                                            </ul>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && selectedOrder && (

                <OverlayPopup
                    isExpanded={false}
                    // customToastRef={customToastCopyGraph}
                    customToastRefClassName={"toastPopUpCustomGraphCopy"}
                    closePopupOverlay={popupOverlay}
                    popupChild={<TaskModal
                        orderId={selectedOrder.order_id}
                        selectedOrder={selectedOrder}
                        onClose={() => {
                            setShowModal(false);
                            setSelectedOrder(null);
                        }}
                    />} />

            )}
        </div>
    );
}