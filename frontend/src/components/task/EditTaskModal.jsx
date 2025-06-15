"use client"

import { useState, useEffect } from "react"
import { Form, Button } from "react-bootstrap"

// Same enums as above
const TASK_UNITS = [
  "PROCUREMENT",
  "COLLAR",
  "CUTTING",
  "PRINTING",
  "EMBROIDERY",
  "STITCHING",
  "PACKAGING",
  "UNASSIGNED"
]

const STATUS_OPTIONS = [
  { value: "NOT STARTED", label: "Not Started" },
  { value: "IN PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" }
]

function EditTaskModal({ task, allTasks, onClose, onUpdate, toast, fetchOrders, fetchTasksForOrder, selectedOrder }) {
  const [taskName, setTaskName] = useState(task.name)
  const [product, setProduct] = useState(task.product || "")
  const [color, setColor] = useState(task.color || "")
  const [taskUnit, setTaskUnit] = useState(task.task_unit || "UNASSIGNED")
  const [status, setStatus] = useState(task.status)
  const [dependencies, setDependencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [taskUnitName, setTaskUnitName] = useState(task.task_unit_name || "")

  useEffect(() => {
    if (task.dependencies) {
      try {
        setDependencies(JSON.parse(task.dependencies))
      } catch {
        setDependencies([])
      }
    }
  }, [task])

  const handleDependencyChange = e => {
    const opts = Array.from(e.target.options)
      .filter(o => o.selected)
      .map(o => o.value)
    setDependencies(opts)
  }

  const handleSubmit = async () => {
    if (!taskName.trim()) {
      toast.current.show({ severity: "warn", summary: "Warning", detail: "Task name is required" })
      return
    }
    const payload = {
      name: taskName,
      product,
      color,
      task_unit: taskUnit,
      task_unit_name: taskUnitName,
      status,
      dependencies
    }
    setLoading(true)
    try {
      const resp = await fetch(
        `${process.env.REACT_APP_PATCH_ALL_TASKS}${task.task_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )
      if (!resp.ok) throw new Error(resp.statusText)
      // const updated = await resp.json()
      await fetchOrders()
      if(selectedOrder){
        await fetchTasksForOrder(selectedOrder.order_id)
      }
      onUpdate()
      toast.current.show({ severity: "success", summary: "Success", detail: "Task updated" })
    } catch (err) {
      console.error(err)
      toast.current.show({ severity: "error", summary: "Error", detail: "Update failed" })
    } finally {
      setLoading(false)
    }
  }

  const availableDeps = allTasks.filter(t => t.task_id !== task.task_id)

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Task Name</Form.Label>
        <Form.Control
          type="text"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Product</Form.Label>
        <Form.Control
          type="text"
          value={product}
          onChange={e => setProduct(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Color</Form.Label>
        <Form.Control
          type="text"
          value={color}
          onChange={e => setColor(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Task Unit</Form.Label>
        <Form.Select value={taskUnit} onChange={e => setTaskUnit(e.target.value)}>
          {TASK_UNITS.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Task Unit Name</Form.Label>
        <Form.Control
          type="text"
          value={taskUnitName}
          onChange={e => setTaskUnitName(e.target.value)}
          placeholder="e.g. A / B"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Status</Form.Label>
        <Form.Select value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Dependencies</Form.Label>
        <Form.Select
          multiple
          value={dependencies}
          onChange={handleDependencyChange}
          style={{ height: 120 }}
        >
          {availableDeps.map(t => (
            <option key={t.task_id} value={t.task_id}>{t.name}</option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">Ctrl/Cmd+Click to select multiple</Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <> <span className="spinner-border spinner-border-sm me-2" /> Updating... </>
            : "Update Task"}
        </Button>
      </div>
    </Form>
  )
}

export { EditTaskModal }
