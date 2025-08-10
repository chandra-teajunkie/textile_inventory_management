"use client"

import { useEffect, useState } from "react"
import { Card, Button, Badge, Form, Modal, Tab, Tabs } from "react-bootstrap"
import { EditTaskModal } from "./EditTaskModal"
import TaskUnitVisualization from "./TaskUnitVisualization"
import { GrClose } from "react-icons/gr"
import { FaCut, FaPrint, FaEdit, FaBox, FaQuestion, FaChartBar } from "react-icons/fa"
import "./overlay.css"
import { GiSewingMachine } from 'react-icons/gi'; // Sewing machine icon
import { GiHeavyCollar } from "react-icons/gi";
import { TbHttpGet } from "react-icons/tb";

const getTaskUnitIcon = (unit) => {
  switch (unit) {
    case "PROCUREMENT":
      return <TbHttpGet />
    case "COLLAR":
      return <GiHeavyCollar />
    case "CUTTING":
      return <FaCut />
    case "PRINTING":
      return <FaPrint />
    case "EMBROIDERY":
      return <FaEdit />
    case "STITCHING":
      return <GiSewingMachine />
    case "PACKAGING":
      return <FaBox />
    case "UNASSIGNED":
      return <FaQuestion />
    default:
      return <FaQuestion />
  }
}

const getTaskUnitColor = (unit) => {
  switch (unit) {
    case "PROCUREMENT":
      return "primary"
    case "COLLAR":
      return "warning"
    case "CUTTING":
      return "danger"
    case "PRINTING":
      return "primary"
    case "EMBROIDERY":
      return "warning"
    case "STITCHING":
      return "success"
    case "PACKAGING":
      return "info"
    case "UNASSIGNED":
      return "secondary"
    default:
      return "secondary"
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case "NOT STARTED":
      return "secondary"
    case "IN PROGRESS":
      return "warning"
    case "COMPLETED":
      return "success"
    case "BLOCKED":
      return "danger"
    default:
      return "secondary"
  }
}

export default function TaskList({ toast }) {
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTask, setEditTask] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [activeTab, setActiveTab] = useState("list")

  // Fetch orders once
  useEffect(() => {
    fetch(process.env.REACT_APP_GET_ALL_ORDERS)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setOrders)
      .catch((err) => {
        console.error(err)
        toast.current.show({ severity: "error", summary: "Error", detail: "Could not load orders" })
      })
  }, [])

  // Fetch tasks whenever order changes
  useEffect(() => {
    if (!selectedOrderId) return setTasks([])
    setLoading(true)
    fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${selectedOrderId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setTasks)
      .catch((err) => {
        console.error(err)
        toast.current.show({ severity: "error", summary: "Error", detail: "Could not load tasks" })
      })
      .finally(() => setLoading(false))
  }, [selectedOrderId])

  const handleOrderChange = (e) => setSelectedOrderId(e.target.value)

  const handleEditTask = (task) => {
    setEditTask(task)
    setShowEditModal(true)
  }

  const handleTaskUpdated = (updatedTask) => {
    if (!selectedOrderId) return setTasks([])
    setLoading(true)
    fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${selectedOrderId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setTasks)
      .catch((err) => {
        console.error(err)
        toast.current.show({ severity: "error", summary: "Error", detail: "Could not load tasks" })
      })
      .finally(() => setLoading(false))
    // Replace in list
    // setTasks((ts) => ts.map((t) => (t.purchase_order_id === updatedTask.purchase_order_id ? updatedTask : t)))
    setShowEditModal(false)
    toast.current.show({ severity: "success", summary: "Success", detail: "Task updated" })
  }

  const deleteTask = async () => {
    if (!taskToDelete) return
    try {
      const res = await fetch(`${process.env.REACT_APP_DELETE_TASK}${taskToDelete.purchase_order_id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setTasks((ts) => ts.filter((t) => t.purchase_order_id !== taskToDelete.purchase_order_id))
      toast.current.show({ severity: "success", summary: "Deleted", detail: "Task deleted" })
    } catch {
      toast.current.show({ severity: "error", summary: "Error", detail: "Could not delete task" })
    } finally {
      setTaskToDelete(null)
    }
  }

  const hasChartData = (task) => {
    return task.incoming_chart || task.outgoing_chart
  }

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus
    const unitMatch = filterUnit === "all" || task.purchase_order_unit === filterUnit
    return statusMatch && unitMatch
  })

  return (
    <>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 fw-bold">Tasks Management</h1>
        </div>

        <Card className="mb-4">
          <Card.Body>
            <Form.Group>
              <Form.Label>Select Order</Form.Label>
              <Form.Select value={selectedOrderId} onChange={handleOrderChange}>
                <option value="">— pick one —</option>
                {orders.map((o) => (
                  <option key={o.order_id} value={o.order_id}>
                    {o.customer_name.toUpperCase()} ({o.types})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>

        {selectedOrderId && (
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="list" title="📋 Task List">
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {/* Status Filters */}
                    <div className="btn-group me-3">
                      {["all", "NOT STARTED", "IN PROGRESS", "COMPLETED", "BLOCKED"].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={filterStatus === s ? "primary" : "outline-primary"}
                          onClick={() => setFilterStatus(s)}
                        >
                          {s === "all" ? "All" : s}
                        </Button>
                      ))}
                    </div>

                    {/* Unit Filters */}
                    <div className="btn-group">
                      <Button
                        size="sm"
                        variant={filterUnit === "all" ? "success" : "outline-success"}
                        onClick={() => setFilterUnit("all")}
                      >
                        All Units
                      </Button>
                      {["PROCUREMENT", "COLLAR", "CUTTING", "PRINTING", "EMBROIDERY", "STITCHING", "PACKAGING", "UNASSIGNED"].map((unit) => (
                        <Button
                          key={unit}
                          size="sm"
                          variant={filterUnit === unit ? "success" : "outline-success"}
                          onClick={() => setFilterUnit(unit)}
                        >
                          {getTaskUnitIcon(unit)} {unit}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" />
                      <p className="mt-2">Loading tasks...</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <p className="text-center text-muted">No tasks match the current filters</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Unit</th>
                            <th>Product</th>
                            <th>Charts</th>
                            <th>Dependencies</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map((t) => (
                            <tr key={t.purchase_order_id}>
                              <td className="fw-medium">{t.name}</td>
                              <td>
                                <Badge bg={getStatusColor(t.status)}>{t.status}</Badge>
                              </td>
                              <td>
                                <Badge bg={getTaskUnitColor(t.purchase_order_unit)}>
                                  {getTaskUnitIcon(t.purchase_order_unit)} {t.purchase_order_unit}
                                </Badge>
                              </td>
                              <td>
                                <span className="text-muted">{t.product}</span>
                                {t.color && (
                                  <Badge bg="light" text="dark" className="ms-1">
                                    {t.color}
                                  </Badge>
                                )}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  {t.incoming_chart && (
                                    <Badge bg="primary" title="Has incoming chart">
                                      📥 In
                                    </Badge>
                                  )}
                                  {t.outgoing_chart && (
                                    <Badge bg="success" title="Has outgoing chart">
                                      📤 Out
                                    </Badge>
                                  )}
                                  {!hasChartData(t) && (
                                    <Badge bg="light" text="dark" title="No charts available">
                                      📊 None
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td>
                                {t.dependencies && JSON.parse(t.dependencies).length > 0
                                  ? JSON.parse(t.dependencies)
                                    .map((id) => {
                                      const dep = tasks.find((x) => x.purchase_order_id === id)
                                      return dep ? dep.name : id
                                    })
                                    .join(", ")
                                  : "—"}
                              </td>
                              <td className="text-end">
                                <Button size="sm" onClick={() => handleEditTask(t)} className="me-2">
                                  Edit
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => setTaskToDelete(t)}>
                                  Delete
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
            </Tab>

            <Tab eventKey="visualization" title="📊 Unit Visualization">
              <TaskUnitVisualization tasks={tasks} />
            </Tab>
          </Tabs>
        )}
        <Modal show={!!taskToDelete} onHide={() => setTaskToDelete(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete "{taskToDelete?.name}"?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setTaskToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteTask}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      {/* Edit Modal */}
      {showEditModal && editTask && (
        <div className="micrositeOverlay">
          <div className="micrositeOuter minimize">
            <button className="micrositeClose overlayCloseButton" onClick={() => setShowEditModal(false)}>
              <GrClose />
            </button>
            <div className="overlayBody p-2 bg-white rounded editTaskTabs">
              <h5 className="mb-3">
                <FaChartBar className="me-2" />
                Task Management: {editTask?.name}
              </h5>
              <EditTaskModal
                task={editTask}
                selectedOrder={orders.find((o) => o.order_id === selectedOrderId)}
                allTasks={tasks}
                onClose={() => setShowEditModal(false)}
                onUpdate={handleTaskUpdated}
                toast={toast}
              />
            </div>
          </div>
        </div>
      )}
    </>

  )
}
