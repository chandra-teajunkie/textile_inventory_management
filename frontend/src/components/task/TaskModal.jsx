"use client"

import { useState, useEffect } from "react"
import { Form, Button } from "react-bootstrap"
import Select from "react-select"
import { PurchaseOrderUnit } from "../../utils/constants"
import { parseJsonSafe } from "../../utils/jsonUtils"

// Mirror your backend enums
const TASK_UNITS = [
  "PROCUREMENT",
  "COLLAR",
  "CUTTING",
  "PRINTING",
  "EMBROIDERY",
  "STITCHING",
  "PACKAGING",
  "UNASSIGNED",
]

const STATUS_OPTIONS = [
  { value: "NOT STARTED", label: "Not Started" },
  { value: "IN PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
]

function TaskModal({ orderId, selectedOrder, onClose, onTaskCreated, toast, onUpdate, fetchOrders, fetchTasksForOrder, orderPurchaseUnitNotes }) {
  const [taskName, setTaskName] = useState("")
  const [taskUnit, setTaskUnit] = useState("UNASSIGNED")
  const [status, setStatus] = useState("NOT STARTED")
  const [loading, setLoading] = useState(false)
  const [allTasks, setAllTasks] = useState([])
  const [dependencies, setDependencies] = useState([])
  const [taskUnitName, setTaskUnitName] = useState("")
  const [selectedCombinations, setSelectedCombinations] = useState([])
  const [specialNotes, setSpecialNotes] = useState("")

  // Create product-color combinations
  const createProductColorCombinations = () => {
    const products = selectedOrder?.types
      ? selectedOrder.types
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      : []

    const colors = selectedOrder?.colors
      ? selectedOrder.colors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      : []

    const combinations = []

    products.forEach((product) => {
      colors.forEach((color) => {
        combinations.push({
          value: `${product}-${color}`,
          label: `${product} - ${color}`,
          product,
          color,
        })
      })
    })

    return combinations
  }

  const productColorOptions = createProductColorCombinations()

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

  const handleSelectAll = () => {
    setSelectedCombinations(productColorOptions)
  }

  const handleDeselectAll = () => {
    setSelectedCombinations([])
  }

  const handleCombinationChange = (selectedOptions) => {
    setSelectedCombinations(selectedOptions || [])
  }

  const handleSubmit = async () => {
    if (!taskName.trim()) {
      toast.current.show({ severity: "warn", summary: "Warning", detail: "Task name is required" })
      return
    }

    if (selectedCombinations.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please select at least one product-color combination",
      })
      return
    }

    setLoading(true)

    try {
      const taskPromises = selectedCombinations.map(async (combination) => {
        const payload = {
          order_id: orderId,
          name: `${taskName} - ${combination.label}`,
          product: combination.product,
          color: combination.color,
          purchase_order_unit: taskUnit,
          purchase_order_unit_name: taskUnitName,
          status,
          dependencies,
          special_notes: specialNotes,
        }

        const resp = await fetch(process.env.REACT_APP_POST_ALL_TASKS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!resp.ok) throw new Error(`Failed to create task for ${combination.label}`)
        return await resp.json()
      })

      const results = await Promise.all(taskPromises)

      // Call onTaskCreated for each result or pass all results
      results.forEach((result) => onTaskCreated(result))

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: `${selectedCombinations.length} task(s) created successfully`,
      })

      // Reset form
      setTaskName("")
      setSelectedCombinations([])
      setTaskUnitName("")
      setDependencies([])

      // const updated = await resp.json()
      await fetchOrders()
      if (selectedOrder) {
        await fetchTasksForOrder(selectedOrder.order_id)
      }
      onUpdate()

    } catch (err) {
      console.error(err)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create one or more tasks",
      })
    } finally {
      setLoading(false)
    }
  }

  // Custom components for react-select
  const customComponents = {
    Option: ({ children, ...props }) => (
      <div
        {...props.innerProps}
        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${props.isSelected ? "bg-blue-100" : ""}`}
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          backgroundColor: props.isSelected ? "#e3f2fd" : props.isFocused ? "#f5f5f5" : "white",
        }}
      >
        <input type="checkbox" checked={props.isSelected} onChange={() => { }} style={{ marginRight: "8px" }} />
        {children}
      </div>
    ),
    MultiValue: ({ children, ...props }) => (
      <div
        style={{
          backgroundColor: "#e3f2fd",
          color: "#1976d2",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "14px",
          marginRight: "4px",
          marginBottom: "4px",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {children}
        <button
          onClick={props.removeProps.onClick}
          style={{
            marginLeft: "4px",
            color: "#1976d2",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ×
        </button>
      </div>
    ),
  }

  return (
    <Form
      style={{
        display: "grid",
        width: "-webkit-fill-available",
      }}
    >
      <div style={{ maxHeight: "auto", overflow: "auto" }}>
        <Form.Group className="mb-3">
          <Form.Label>Task Unit</Form.Label>
          <Form.Select value={taskUnit} onChange={(e) => setTaskUnit(e.target.value)}>
            {TASK_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Task Name</Form.Label>
          <Form.Control
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name (will be combined with product-color)"
          />
          <Form.Text className="text-muted">
            Each task will be named: "{taskName} - {"Product - Color"}"
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Product-Color Combinations</Form.Label>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleSelectAll}
                className="me-2"
                disabled={selectedCombinations.length === productColorOptions.length}
              >
                Select All
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedCombinations.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          <Select
            isMulti
            value={selectedCombinations}
            onChange={handleCombinationChange}
            options={productColorOptions}
            placeholder="Select product-color combinations"
            components={customComponents}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            controlShouldRenderValue={true}
            menuPlacement="auto"
            maxMenuHeight={200}
          />

          <Form.Text className="text-muted">
            {selectedCombinations.length} combination(s) selected.
            {selectedCombinations.length > 0 && ` This will create ${selectedCombinations.length} separate task(s).`}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Task Unit Name</Form.Label>
          <Form.Control
            type="text"
            value={taskUnitName}
            onChange={(e) => setTaskUnitName(e.target.value)}
            placeholder="e.g. A / B"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Order-level Purchase Unit Notes (Read-Only) */}
        {orderPurchaseUnitNotes && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Order Notes for this Unit ({taskUnit.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())})</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={(parseJsonSafe(orderPurchaseUnitNotes)[taskUnit] || 'No order-level notes for this unit.')}
                  readOnly
                  plaintext
                />
          </Form.Group>
        )}

        {/* Task-specific Special Notes (Editable) */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Task Special Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="Add any specific notes for this task..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Dependencies</Form.Label>
          <Select
            isMulti
            value={dependencies
              .map((dep) => {
                const task = allTasks.find((t) => t.purchase_order_id === dep)
                return task ? { value: task.purchase_order_id, label: task.name } : null
              })
              .filter(Boolean)}
            onChange={(selectedOptions) => setDependencies(selectedOptions.map((opt) => opt.value))}
            options={allTasks.map((t) => ({ value: t.purchase_order_id, label: t.name }))}
            placeholder="Select Dependencies"
            menuPlacement="top"
            isDisabled={selectedCombinations.length > 1}
          />
          {selectedCombinations.length > 1 && (
            <Form.Text className="text-muted">Dependencies are disabled when creating multiple product-color tasks to avoid incorrect cross-task links. Set dependencies after creating tasks if needed.</Form.Text>
          )}
        </Form.Group>

        {/* Preview section */}
        {selectedCombinations.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Label>Task Preview</Form.Label>
            <div className="border rounded p-3 bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
              <small className="text-muted">The following tasks will be created:</small>
              <ul className="mb-0 mt-2">
                {selectedCombinations.map((combination, index) => (
                  <li key={combination.value} className="small">
                    {taskName ? `${taskName} - ${combination.label}` : combination.label}
                  </li>
                ))}
              </ul>
            </div>
          </Form.Group>
        )}
      </div>

      <div
        className="d-flex"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          bottom: "0",
          position: "sticky",
          background: "white",
        }}
      >
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button variant="primary" onClick={handleSubmit} disabled={loading || selectedCombinations.length === 0}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating {selectedCombinations.length} Task(s)...
              </>
            ) : (
              `Create ${selectedCombinations.length} Task(s)`
            )}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Form>
  )
}

export { TaskModal }
