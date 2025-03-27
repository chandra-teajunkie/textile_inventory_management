"use client"

import { useEffect, useState } from "react"
import { Card, Button, Badge, Form, Modal, ProgressBar } from "react-bootstrap"
import { EditTaskModal } from "./EditTaskModal"
import { GrLanguage, GrClose } from "react-icons/gr";
import './overlay.css'

function TaskList({ toast }) {
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTask, setEditTask] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")

  const fetchOrders = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_GET_ALL_ORDERS)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error("Error fetching orders:", err)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load orders",
        life: 3000,
      })
    }
  }

  const fetchTasks = async (orderId) => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${orderId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      console.error("Error fetching tasks:", err)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load tasks",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (selectedOrderId) {
      fetchTasks(selectedOrderId)
    }
  }, [selectedOrderId])

  const handleOrderChange = (e) => {
    setSelectedOrderId(e.target.value)
  }

  const handleEditTask = (task) => {
    setEditTask(task)
    setShowEditModal(true)
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map((task) => (task.task_id === updatedTask.task_id ? updatedTask : task)))
    setShowEditModal(false)
    setEditTask(null)

    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Task updated successfully",
      life: 3000,
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "NOT STARTED":
        return "secondary"
      case "IN PROGRESS":
        return "warning"
      case "COMPLETED":
        return "success"
      default:
        return "secondary"
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "NOT STARTED":
        return "text-secondary"
      case "IN PROGRESS":
        return "text-warning"
      case "COMPLETED":
        return "text-success"
      default:
        return "text-secondary"
    }
  }

  const getProgressValue = (status) => {
    switch (status) {
      case "NOT STARTED":
        return 0
      case "IN PROGRESS":
        return 50
      case "COMPLETED":
        return 100
      default:
        return 0
    }
  }

  const filteredTasks = filterStatus === "all" ? tasks : tasks.filter((task) => task.status === filterStatus)

  const exportTasks = () => {
    if (!tasks.length) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "No tasks to export",
        life: 3000,
      })
      return
    }

    // Create CSV content
    const headers = ["Task ID", "Name", "Status", "Dependencies", "Order ID"]
    const csvContent = [
      headers.join(","),
      ...filteredTasks.map((task) =>
        [task.task_id, task.name, task.status, JSON.parse(task.dependencies || "[]").join(";"), task.order_id].join(
          ",",
        ),
      ),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "tasks.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.current.show({
      severity: "success",
      summary: "Export Complete",
      detail: "Tasks exported to CSV",
      life: 3000,
    })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">Tasks</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={exportTasks}>
            <i className="bi bi-download me-2"></i>
            Export
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Select Order</Form.Label>
            <Form.Select value={selectedOrderId} onChange={handleOrderChange}>
              <option value="">Select an Order</option>
              {orders.map((order) => (
                <option key={order.order_id} value={order.order_id}>
                  {order.customer_id} ({order.order_id})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {selectedOrderId && (
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div className="btn-group">
                <Button
                  variant={filterStatus === "all" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("all")}
                >
                  All Tasks
                </Button>
                <Button
                  variant={filterStatus === "NOT STARTED" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("NOT STARTED")}
                >
                  Not Started
                </Button>
                <Button
                  variant={filterStatus === "IN PROGRESS" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("IN PROGRESS")}
                >
                  In Progress
                </Button>
                <Button
                  variant={filterStatus === "COMPLETED" ? "primary" : "outline-primary"}
                  onClick={() => setFilterStatus("COMPLETED")}
                >
                  Completed
                </Button>
              </div>
              <Form.Control
                type="search"
                placeholder="Search tasks..."
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
                <p className="mt-2">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center p-5">
                <i className="bi bi-clipboard-check display-1 text-muted"></i>
                <p className="mt-3">No tasks found for this order</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Dependencies</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.task_id}>
                        <td className="fw-medium">{task.name}</td>
                        <td>
                          <Badge bg={getStatusColor(task.status)}>{task.status}</Badge>
                        </td>
                        <td style={{ width: "20%" }}>
                          <ProgressBar
                            now={getProgressValue(task.status)}
                            variant={
                              task.status === "COMPLETED"
                                ? "success"
                                : task.status === "IN PROGRESS"
                                  ? "warning"
                                  : "secondary"
                            }
                          />
                        </td>
                        <td>
                          {task.dependencies && task.dependencies !== "[]"
                            ? JSON.parse(task.dependencies)
                              .map((id) => {
                                const depTask = tasks.find((t) => t.task_id === id)
                                return depTask ? depTask.name : id
                              })
                              .join(", ")
                            : "—"}
                        </td>
                        <td className="text-end">
                          <Button variant="primary" size="sm" onClick={() => handleEditTask(task)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
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
                  allTasks={tasks}
                  onClose={() => setShowEditModal(false)}
                  onUpdate={handleTaskUpdated}
                  selectedOrder={{ value: selectedOrderId }}
                  toast={toast}
                />
              )}
            </Modal.Body>
            {/* </Modal> */}
          </div>
        </div></div>}

    </div >
  )
}

export default TaskList

