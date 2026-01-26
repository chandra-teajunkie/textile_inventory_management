"use client"

import { useState, useEffect } from "react"
import { Form, Button } from "react-bootstrap"
import Select from "react-select"
import { parseJsonSafe } from "../../utils/jsonUtils"
import cfg from "../../utils/runtimeConfig"

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
  const [specialNotes, setSpecialNotes] = useState(task.special_notes || "")

  useEffect(() => {
    if (task.dependencies) {
      try {
        setDependencies(parseJsonSafe(task.dependencies, []))
      } catch {
        setDependencies([])
      }
    }
    // sync other editable fields when the task prop changes
    setTaskName(task.name)
    setProduct(task.product || "")
    setColor(task.color || "")
    setTaskUnit(task.task_unit || "UNASSIGNED")
    setStatus(task.status)
    setTaskUnitName(task.task_unit_name || "")
    setSpecialNotes(task.special_notes || "")
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
      dependencies,
      special_notes: specialNotes
    }
    setLoading(true)
    console.log("Updating task with payload:", payload, `${cfg.PATCH_ALL_TASKS}${task.task_id}`)
    try {
      const resp = await fetch(
        `${cfg.PATCH_ALL_TASKS}${task.task_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )

      // Parse response data first to check for errors
      const responseData = await resp.json()

      if (!resp.ok) {
        console.error("Task update failed:", responseData)
        toast.current.show({
          severity: "error",
          summary: "Update Failed",
          detail: responseData.detail || responseData.message || "Failed to update task"
        })
        return  // Exit early on error - do NOT close modal
      }

      // Only proceed if successful
      console.log("Task updated successfully:", responseData)
      await fetchOrders()
      if (selectedOrder) {
        // Fix: Use purchase_order_id as that's what backend returns
        await fetchTasksForOrder(selectedOrder.purchase_order_id || selectedOrder.order_id)
      }
      onUpdate()
      toast.current.show({ severity: "success", summary: "Success", detail: "Task updated successfully" })
      onClose()  // Close modal only on success
    } catch (err) {
      console.error("Network error updating task:", err)
      toast.current.show({ severity: "error", summary: "Network Error", detail: err.message || "Failed to update task" })
    } finally {
      setLoading(false)
    }
  }

  const availableDeps = allTasks.filter(t => t.task_id !== task.task_id)

  return (
    <Form
      style={{
        display: "grid",
        // justifyContent: space-between;
        width: "-webkit-fill-available",
        height: "-webkit-fill-available",
        // overflow: "auto"
      }}

    >
      <div style={{ maxHeight: "auto", overflow: "auto", paddingRight: "1rem", }}>

        <Form.Group className="mb-3">
          <Form.Label>Task Unit</Form.Label>
          <Form.Select
            value={taskUnit}
            onChange={e => setTaskUnit(e.target.value)}
            className="glass-dropdown-enhanced"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {TASK_UNITS.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Display order-level note for this task's unit (read-only) */}
        {selectedOrder?.purchase_unit_notes && (
          (() => {
            const notesObj = typeof selectedOrder.purchase_unit_notes === 'string' ? parseJsonSafe(selectedOrder.purchase_unit_notes, {}) : (selectedOrder.purchase_unit_notes || {})
            const unitNote = notesObj[taskUnit] || notesObj[taskUnit.toLowerCase()] || ''
            return (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Order Note for {taskUnit.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</Form.Label>
                <Form.Control as="textarea" rows={3} value={unitNote || 'No notes for this unit.'} readOnly plaintext />
              </Form.Group>
            )
          })()
        )}

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
          <Select
            value={product ? { label: product, value: product } : null}
            onChange={(selected) => setProduct(selected ? selected.value : "")}
            options={(selectedOrder?.types?.split(",") || []).map(p => ({ label: p.trim(), value: p.trim() }))}
            placeholder="Select a product"
            isClearable
            className="glass-react-select"
            classNamePrefix="react-select"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Color</Form.Label>
          <Select
            value={color ? { label: color, value: color } : null}
            onChange={(selected) => setColor(selected ? selected.value : "")}
            options={(selectedOrder?.colors?.split(",") || []).map(c => ({ label: c.trim(), value: c.trim() }))}
            placeholder="Select a color"
            isClearable
            className="glass-react-select"
            classNamePrefix="react-select"
          />
        </Form.Group>

        {/* <Form.Group className="mb-3">
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
      </Form.Group> */}



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
          <Form.Label>Special Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={specialNotes}
            onChange={e => setSpecialNotes(e.target.value)}
            placeholder="Add or edit task special notes"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="glass-dropdown-enhanced"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
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
            options={availableDeps.map(t => ({ value: t.task_id, label: t.name }))}
            placeholder="Select dependencies"
            menuPlacement="top"
            className="glass-react-select"
            classNamePrefix="react-select"
          />
          {/* legacy fallback select removed - dependencies now use task_id values */}

        </Form.Group>
      </div>

      <div className="d-flex"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          bottom: "0",
          position: "sticky",
          // background: "white",
          // maxHeight: "20%"
        }}
      >
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <> <span className="spinner-border spinner-border-sm me-2" /> Updating... </>
              : "Update Task"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Form >
  )
}

export { EditTaskModal }
