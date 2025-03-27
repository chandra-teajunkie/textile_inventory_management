"use client"

import { useState, useEffect } from "react"
import { Form, Button } from "react-bootstrap"

function EditTaskModal({ task, allTasks, onClose, onUpdate, selectedOrder, toast }) {
  const [taskName, setTaskName] = useState(task.name)
  const [status, setStatus] = useState(task.status)
  const [loading, setLoading] = useState(false)
  const [dependencies, setDependencies] = useState([])

  const STATUS_OPTIONS = [
    { value: "NOT STARTED", label: "Not Started" },
    { value: "IN PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
  ]

  useEffect(() => {
    if (task.dependencies) {
      try {
        const parsed = JSON.parse(task.dependencies)
        setDependencies(parsed)
      } catch (e) {
        console.error("Error parsing dependencies:", e)
        setDependencies([])
      }
    }
  }, [task])

  const handleDependencyChange = (e) => {
    const options = e.target.options
    const selectedValues = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value)
      }
    }
    setDependencies(selectedValues)
  }

  const handleSubmit = async () => {
    if (!taskName) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter a task name",
        life: 3000,
      })
      return
    }

    const payload = {
      name: taskName,
      status: status,
      dependencies: dependencies,
    }

    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3002/tasks/${task.task_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const updated = await response.json()
      onUpdate(updated)
    } catch (error) {
      console.error("Update error:", error)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update task",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const availableDeps = allTasks.filter((t) => t.task_id !== task.task_id)

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Task Name</Form.Label>
        <Form.Control type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Status</Form.Label>
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Dependencies</Form.Label>
        <Form.Select multiple value={dependencies} onChange={handleDependencyChange} style={{ height: "120px" }}>
          {availableDeps.map((t) => (
            <option key={t.task_id} value={t.task_id}>
              {t.name}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">Hold Ctrl (or Cmd) to select multiple tasks</Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Updating...
            </>
          ) : (
            "Update Task"
          )}
        </Button>
      </div>
    </Form>
  )
}

export { EditTaskModal }

