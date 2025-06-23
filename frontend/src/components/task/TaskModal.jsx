"use client"

import { useState, useEffect } from "react"
import { Form, Button } from "react-bootstrap"
import Select from "react-select"

// Mirror your backend enums
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

function TaskModal({ orderId, selectedOrder, onClose, onTaskCreated, toast }) {
  const [taskName, setTaskName] = useState("")
  const [product, setProduct] = useState("")
  const [color, setColor] = useState("")
  const [taskUnit, setTaskUnit] = useState("UNASSIGNED")
  const [status, setStatus] = useState("NOT STARTED")
  const [loading, setLoading] = useState(false)
  const [allTasks, setAllTasks] = useState([])
  const [dependencies, setDependencies] = useState([])
  const [taskUnitName, setTaskUnitName] = useState("")

  // Extract available products and colors from selectedOrder
  const availableProducts = selectedOrder?.types
    ? selectedOrder.types.split(',').map(item => item.trim()).filter(Boolean)
    : [];

  const availableColors = selectedOrder?.colors
    ? selectedOrder.colors.split(',').map(item => item.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    // fetch existing tasks for dependencies
    async function fetchTasks() {
      try {
        const resp = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${orderId}`)
        if (!resp.ok) throw new Error(resp.statusText)
        setAllTasks(await resp.json())
      } catch (e) {
        console.error(e)
        toast.current.show({ severity: "error", summary: "Error", detail: "Could not load tasks" })
      }
    }
    fetchTasks()
  }, [orderId, toast])

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
      order_id: orderId,
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
      const resp = await fetch(process.env.REACT_APP_POST_ALL_TASKS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) throw new Error(resp.statusText)
      const result = await resp.json()
      onTaskCreated(result)
      toast.current.show({ severity: "success", summary: "Success", detail: "Task created" })
    } catch (err) {
      console.error(err)
      toast.current.show({ severity: "error", summary: "Error", detail: "Failed to create task" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      style={{
        display: "grid",
        // justifyContent: space-between;
        width: "-webkit-fill-available",
        // overflow: "auto"
      }}

    >
      <div style={{ maxHeight: "auto", overflow: "auto" }}>
        <Form.Group className="mb-3">
          <Form.Label>Task Name</Form.Label>
          <Form.Control
            type="text"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            placeholder="Enter task name"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Product</Form.Label>
          <Select
            isMulti
            value={(product || "").split(", ").filter(Boolean).map(p => ({ label: p, value: p }))}
            onChange={(selected) => setProduct(selected.map(o => o.value).join(", "))}
            options={(selectedOrder?.types?.split(",") || []).map(p => ({ label: p.trim(), value: p.trim() }))}
            placeholder="Select product(s)"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Color</Form.Label>
          <Select
            isMulti
            value={(color || "").split(", ").filter(Boolean).map(c => ({ label: c, value: c }))}
            onChange={(selected) => setColor(selected.map(o => o.value).join(", "))}
            options={(selectedOrder?.colors?.split(",") || []).map(c => ({ label: c.trim(), value: c.trim() }))}
            placeholder="Select color(s)"
          />
        </Form.Group>

        {/* <Form.Group className="mb-3">
        <Form.Label>Product</Form.Label>
        <Form.Control
          type="text"
          value={product}
          onChange={e => setProduct(e.target.value)}
          placeholder="e.g. Pant / Shirt / etc."
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Color</Form.Label>
        <Form.Control
          type="text"
          value={color}
          onChange={e => setColor(e.target.value)}
          placeholder="e.g. Blue / Red"
        />
      </Form.Group> */}

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
          <Select
            isMulti
            value={dependencies.map(dep => {
              const task = allTasks.find(t => t.task_id === dep)
              return task ? { value: task.task_id, label: task.name } : null
            }).filter(Boolean)}
            onChange={selectedOptions => setDependencies(selectedOptions.map(opt => opt.value))}
            options={allTasks.map(t => ({ value: t.task_id, label: t.name }))}
            placeholder="Select Dependencie(s)"
            menuPlacement="top"
          />
          {/* <Form.Select multiple value={dependencies} onChange={handleDependencyChange} style={{ height: 120 }}>
            {allTasks.map(t => (
              <option key={t.task_id} value={t.task_id}>{t.name}</option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">Ctrl/Cmd+Click to select multiple</Form.Text> */}
        </Form.Group>
      </div>

      <div className="d-flex"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          bottom: "0",
          position: "sticky",
          background: "white",
          // maxHeight: "20%"
        }}
      >
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <> <span className="spinner-border spinner-border-sm me-2" /> Creating... </>
              : "Create Task"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Form>
  )
}

export { TaskModal }
