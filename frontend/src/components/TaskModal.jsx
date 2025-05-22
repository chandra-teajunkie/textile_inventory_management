"use client"

import { useState, useEffect } from "react"
import { Form, Button } from "react-bootstrap"

function TaskModal({ orderId, selectedOrder, onClose, onTaskCreated, toast }) {
  const [taskName, setTaskName] = useState("")
  const [status, setStatus] = useState("NOT STARTED")
  const [loading, setLoading] = useState(false)
  const [allTasks, setAllTasks] = useState([])
  const [dependencies, setDependencies] = useState([])

  const STATUS_OPTIONS = [
    { value: "NOT STARTED", label: "Not Started" },
    { value: "IN PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
  ]

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${orderId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        setAllTasks(data)
      } catch (err) {
        console.error("Error fetching tasks for dependency dropdown:", err)
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load existing tasks",
          life: 3000,
        })
      }
    }
    fetchTasks()
  }, [orderId, toast])

  const handleDependencyChange = (e) => {
    const options = e.target.options
    const selectedValues = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const task = allTasks.find((t) => t.task_id === options[i].value)
        if (task) {
          selectedValues.push(options[i].value)
        }
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
      order_id: orderId,
      name: taskName,
      status: status,
      dependencies: dependencies,
    }

    try {
      setLoading(true)
      const response = await fetch(process.env.REACT_APP_POST_ALL_TASKS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const result = await response.json()

      if (onTaskCreated) {
        onTaskCreated(result)
      } else {
        onClose()
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Task created successfully",
          life: 3000,
        })
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create task : " + `${error}`,
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Task Name</Form.Label>
        <Form.Control
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Enter task name"
        />
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
          {allTasks.map((t) => (
            <option key={t.task_id} value={t.task_id}>
              {t.name}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">Hold Ctrl (or Cmd) to select multiple tasks</Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-start gap-2 mt-4">
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating...
            </>
          ) : (
            "Create Task"
          )}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

      </div>
    </Form>
  )
}

export { TaskModal }

