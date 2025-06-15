"use client"

import React, { useEffect, useState } from "react"
import { Card, Button, Badge, Dropdown, Modal, Form } from "react-bootstrap"
import { TaskModal } from "./TaskModal"
import { EditTaskModal } from "./EditTaskModal";
import { FaTrash } from "react-icons/fa"

import { GrLanguage, GrClose } from "react-icons/gr";
import './overlay.css'

function OrderList({ toast, setActiveTab }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [taskMap, setTaskMap] = useState({})
  const [filterStatus, setFilterStatus] = useState("all")

  const [editTask, setEditTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)



  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(process.env.REACT_APP_GET_ALL_ORDERS)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error("Failed to fetch orders:", err)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load orders",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  // 2) Delete an order
  const deleteOrder = async (orderId) => {
    // if (!window.confirm("Are you sure you want to delete this order?")) return
    setDeletingId(orderId)
  }

  const deleteTask = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`${process.env.REACT_APP_DELETE_ORDER}${deletingId}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      toast.current.show({ severity: "success", summary: "Deleted", detail: "Order removed", life: 3000 })
      await fetchOrders()
    } catch (err) {
      console.error(err)
      toast.current.show({ severity: "error", summary: "Error", detail: "Could not delete order", life: 3000 })
    } finally {
      setDeletingId(null)
    }
  }


  const fetchTasksForOrder = async (orderId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${orderId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setTaskMap((prev) => ({ ...prev, [orderId]: data }))
    } catch (err) {
      console.error(`Failed to fetch tasks for order ${orderId}:`, err)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: `Failed to load tasks for order ${orderId}`,
        life: 3000,
      })
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const toggleTaskList = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
    } else {
      setExpandedOrderId(orderId)
      if (!taskMap[orderId]) {
        fetchTasksForOrder(orderId)
      }
    }
  }

  const handleCreateTask = (order) => {
    setSelectedOrder(order)
    setShowTaskModal(true)
  }

  const handleTaskCreated = () => {
    setShowTaskModal(false)
    setSelectedOrder(null)

    // Clear task map to force refresh
    setTaskMap({})

    // If an order was expanded, refresh its tasks
    if (expandedOrderId) {
      fetchTasksForOrder(expandedOrderId)
    }

    // toast.current.show({
    //   severity: "success",
    //   summary: "Success",
    //   detail: "Task created successfully",
    //   life: 3000,
    // })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Processing":
        return "warning"
      case "Shipped":
        return "primary"
      case "Delivered":
        return "success"
      case "Pending":
        return "danger"
      default:
        return "secondary"
    }
  }

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((order) => order.status === filterStatus)

  const exportOrders = () => {
    // Create CSV content
    const headers = ["Order ID", "Customer", "Type", "Date", "Status", "Total"]
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map((order) =>
        [
          order.order_id,
          order.customer_name,
          order.types,
          order.order_date?.split("T")[0] || "",
          order.status || "Processing",
          order.total || "$0.00",
        ].join(","),
      ),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "orders.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.current.show({
      severity: "success",
      summary: "Export Complete",
      detail: "Orders exported to CSV",
      life: 3000,
    })
  }

  return (
    <>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 fw-bold">Orders</h1>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={exportOrders}>
              <i className="bi bi-download me-2"></i>
              Export
            </Button>
            <Button variant="primary" onClick={() => setActiveTab("create")}>
              <i className="bi bi-plus me-2"></i>
              New Order
            </Button>
          </div>
        </div>
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div className="btn-group">
                <Button
                  variant={filterStatus === "all" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("all")}
                >
                  All Orders
                </Button>
                <Button
                  variant={filterStatus === "Processing" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("Processing")}
                >
                  Processing
                </Button>
                <Button
                  variant={filterStatus === "Shipped" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("Shipped")}
                >
                  Shipped
                </Button>
                <Button
                  variant={filterStatus === "Delivered" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("Delivered")}
                >
                  Delivered
                </Button>
              </div>
              <Form.Control
                type="search"
                placeholder="Search orders..."
                className="w-auto ms-auto me-2"
                style={{ maxWidth: "200px" }}
              />
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center p-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3">No orders found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      {/* <th>Order ID</th> */}
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <React.Fragment key={order.order_id}>
                        <tr>
                          {/* <td className="fw-medium">{order.order_id}</td> */}
                          <td>{order.customer_name.toUpperCase()}</td>
                          <td>{order.types}</td>
                          <td>{new Date(order.order_date).toLocaleDateString()}</td>
                          <td>
                            <Badge bg={getStatusColor(order.status || "Processing")}>
                              {order.status || "Processing"}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <Button variant="primary" size="sm" onClick={() => handleCreateTask(order)}>
                                Create Task
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => toggleTaskList(order.order_id)}
                              >
                                {expandedOrderId === order.order_id ? "Hide Tasks" : "Show Tasks"}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  deleteOrder(order.order_id)
                                  setTaskToDelete(order)
                                }}
                                disabled={deletingId === order.order_id}
                              >
                                <FaTrash />
                              </Button>
                              {/* <Dropdown align="end">
                              <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${order.order_id}`}>
                                <i className="bi bi-three-dots"></i>
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item href="#">View Details</Dropdown.Item>
                                <Dropdown.Item href="#">Update Status</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item href="#">Generate Invoice</Dropdown.Item>
                                <Dropdown.Item href="#">Print Packing Slip</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown> */}
                            </div>
                          </td>
                        </tr>
                        {expandedOrderId === order.order_id && (
                          <tr>
                            <td colSpan="6" className="bg-light">
                              <div className="p-3">
                                <h6 className="mb-3">Tasks for Order #{order.customer_name.toUpperCase()}</h6>
                                {taskMap[order.order_id]?.length > 0 ? (
                                  <ul className="list-group">
                                    {taskMap[order.order_id].map((task) => (
                                      <li
                                        key={task.task_id}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                      >
                                        <div>
                                          <span className="fw-medium">{task.name}</span>
                                          <Badge
                                            bg={
                                              task.status === "COMPLETED"
                                                ? "success"
                                                : task.status === "IN PROGRESS"
                                                  ? "warning"
                                                  : "secondary"
                                            }
                                            className="ms-2"
                                          >
                                            {task.status}
                                          </Badge>
                                        </div>
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => {
                                            setEditTask(task);
                                            setShowEditModal(true);
                                          }}
                                        >
                                          Edit
                                        </Button>

                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted">No tasks available for this order.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
      {showTaskModal && <div className="micrositeOverlay">
        <div className={`micrositeOuter minimize`}>
          <button type="button" className={"micrositeClose overlayCloseButton"} onClick={() => setShowTaskModal(false)} title={"Close"}>
            <GrClose className="closeSearchBtn" tooltip="Close" />
          </button>
          <div className="overlayBody">
            {/* <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered> */}
            {/* <Modal.Header closeButton> */}
            <Modal.Title>Create Task for Order #{selectedOrder?.customer_name}</Modal.Title>
            {/* </Modal.Header> */}
            <Modal.Body>
              {selectedOrder && (
                <TaskModal
                  orderId={selectedOrder.order_id}
                  selectedOrder={selectedOrder}
                  onClose={() => setShowTaskModal(false)}
                  onTaskCreated={handleTaskCreated}
                  toast={toast}
                />
              )}
            </Modal.Body>
            {/* </Modal> */}
          </div>
        </div></div>}

      {showEditModal && <div className="micrositeOverlay">
        <div className={`micrositeOuter minimize`}>
          <button type="button" className={"micrositeClose overlayCloseButton"} onClick={() => setShowEditModal(false)} title={"Close"}>
            <GrClose className="closeSearchBtn" tooltip="Close" />
          </button>
          <div className="overlayBody">
            {/* <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered> */}
            {/* <Modal.Header closeButton> */}
            <Modal.Title>Edit Task</Modal.Title>
            {/* </Modal.Header> */}
            <Modal.Body>
              {editTask && (
                <EditTaskModal
                  task={editTask}
                  allTasks={taskMap[expandedOrderId] || []}
                  selectedOrder={orders.find(o => o.order_id === expandedOrderId)}
                  toast={toast}
                  fetchOrders={fetchOrders}
                  fetchTasksForOrder={fetchTasksForOrder}
                  onUpdate={() => {
                    // const updatedTasks = taskMap[expandedOrderId].map(t =>
                    //   t.task_id === updatedTask.task_id ? updatedTask : t
                    // );
                    // setTaskMap(prev => ({ ...prev, [expandedOrderId]: updatedTasks }));
                    setShowEditModal(false);
                    setEditTask(null);
                  }}
                  onClose={() => setShowEditModal(false)}
                />
              )}
            </Modal.Body>
            {/* </Modal> */}
          </div>
        </div></div>}

      <Modal show={!!taskToDelete} onHide={() => {
        setTaskToDelete(null)
        setDeletingId(null)
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete "{taskToDelete?.customer_name}"?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setTaskToDelete(null)
            setDeletingId(null)
          }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteTask}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  )
}

export default OrderList

