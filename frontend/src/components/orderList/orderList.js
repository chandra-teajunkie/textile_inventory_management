// src/components/OrderList.jsx
import React, { useEffect, useState } from 'react';
import TaskModal from './taskModel';

export default function OrderList() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_GET_ALL_ORDERS);
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Orders</h2>

            <div className="overflow-x-auto">
                <table className="min-w-full border shadow-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-4 py-2">Order ID</th>
                            <th className="border px-4 py-2">Type</th>
                            <th className="border px-4 py-2">Design</th>
                            <th className="border px-4 py-2">Customer</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.order_id}>
                                <td className="border px-4 py-2">{order.order_id}</td>
                                <td className="border px-4 py-2">{order.types}</td>
                                <td className="border px-4 py-2">{order.design_specs}</td>
                                <td className="border px-4 py-2">{order.customer_id}</td>
                                <td className="border px-4 py-2 text-center">
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowModal(true);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-dark px-3 py-1 rounded"
                                    >
                                        Create Task
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && selectedOrder && (
                <TaskModal
                    orderId={selectedOrder.order_id}
                    onClose={() => {
                        setSelectedOrder(null);
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}
