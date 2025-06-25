"use client"

import { useState, useEffect, Fragment, useRef } from "react"
import { Form, Button, Tab, Tabs, Card, Alert } from "react-bootstrap"
import CustomChartComponent from "./CustomChartComponent"
import { FaCut, FaPrint, FaEdit, FaBox, FaQuestion } from "react-icons/fa"
import { GiSewingMachine } from "react-icons/gi" // Sewing machine icon
import Select from "react-select"

const STATUS_OPTIONS = [
  { value: "NOT STARTED", label: "Not Started" },
  { value: "IN PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
]

const TASK_UNITS = [
  { value: "CUTTING", label: "Cutting", icon: <FaCut /> },
  { value: "PRINTING", label: "Printing", icon: <FaPrint /> },
  { value: "EMBROIDERY", label: "Embroidery", icon: <FaEdit /> },
  { value: "STITCHING", label: "Stitching", icon: <GiSewingMachine /> },
  { value: "PACKAGING", label: "Packaging", icon: <FaBox /> },
  { value: "UNASSIGNED", label: "Unassigned", icon: <FaQuestion /> },
]

export function EditTaskModal({ task, selectedOrder, allTasks, onClose, onUpdate, toast }) {
  const [name, setName] = useState(task.name)
  const [status, setStatus] = useState(task.status)
  const [taskUnit, setTaskUnit] = useState(task.task_unit || "UNASSIGNED")
  const [product, setProduct] = useState(task.product || "")
  const [color, setColor] = useState(task.color || "")
  const [dependencies, setDependencies] = useState([])
  const [incomingData, setIncomingData] = useState(null)
  const [outgoingData, setOutgoingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [taskUnitName, setTaskUnitName] = useState(task.task_unit_name || "")

  // Use refs to store the latest chart data
  const incomingDataRef = useRef(null)
  const outgoingDataRef = useRef(null)

  // Parse dependencies once
  useEffect(() => {
    if (task.dependencies) {
      try {
        setDependencies(JSON.parse(task.dependencies))
      } catch {
        setDependencies([])
      }
    }
  }, [task.dependencies])

  // Initialize charts: task's own or fallback to order.size_chart
  useEffect(() => {
    const fallback = selectedOrder?.size_chart ? JSON.parse(selectedOrder.size_chart) : {}

    const incoming = task.incoming_chart ? JSON.parse(task.incoming_chart) : fallback
    const outgoing = task.outgoing_chart ? JSON.parse(task.outgoing_chart) : fallback

    console.log(incoming,"incoming")

    setIncomingData(incoming)
    setOutgoingData(outgoing)
    incomingDataRef.current = incoming
    outgoingDataRef.current = outgoing
  }, [task, selectedOrder])

  const handleIncomingDataChange = (newData) => {
    // console.log("Incoming data change received:", newData)
    setIncomingData(newData)
    incomingDataRef.current = newData // Store in ref for immediate access
  }

  const handleOutgoingDataChange = (newData) => {
    // console.log("Outgoing data change received:", newData)
    setOutgoingData(newData)
    outgoingDataRef.current = newData // Store in ref for immediate access
  }

  const handleSubmit = async (e) => {
    // Prevent default form submission if called from form
    if (e) {
      e.preventDefault()
    }

    if (!name.trim()) {
      toast.current.show({ severity: "warn", summary: "Warning", detail: "Task name is required" })
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name,
        product,
        color,
        task_unit: taskUnit,
        task_unit_name: taskUnitName,
        status,
        dependencies: dependencies, // Send as array directly
      }

      const basic = await fetch(`${process.env.REACT_APP_PATCH_ALL_TASKS}${task.task_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!basic.ok) {
        const errorText = await basic.text()
        throw new Error(`Failed to update basic task info: ${basic.status} - ${errorText}`)
      }

      // Use refs to get the latest chart data
      const currentIncomingData = incomingDataRef.current
      const currentOutgoingData = outgoingDataRef.current

      // console.log("About to upload incoming chart:", currentIncomingData)
      // console.log("About to upload outgoing chart:", currentOutgoingData)

      // 2) Upload incoming chart if data exists using FormData
      if (currentIncomingData && Object.keys(currentIncomingData).length > 0) {
        const incomingFormData = new FormData()
        incomingFormData.append("incoming_chart_json", JSON.stringify(currentIncomingData))

        const incomingResponse = await fetch(`${process.env.REACT_APP_INCOMING_CHART_UPLOAD}${task.task_id}`, {
          method: "PATCH",
          body: incomingFormData,
        })

        if (!incomingResponse.ok) {
          const errorText = await incomingResponse.text()
          console.error("Incoming chart upload failed:", errorText)
          throw new Error(`Incoming chart upload failed: ${errorText}`)
        } else {
          console.log("Incoming chart uploaded successfully")
        }
      }

      // 3) Upload outgoing chart if data exists using FormData
      if (currentOutgoingData && Object.keys(currentOutgoingData).length > 0) {
        const outgoingFormData = new FormData()
        outgoingFormData.append("outgoing_chart_json", JSON.stringify(currentOutgoingData))

        const outgoingResponse = await fetch(`${process.env.REACT_APP_OUTGOING_CHART_UPLOAD}${task.task_id}`, {
          method: "PATCH",
          body: outgoingFormData,
        })

        if (!outgoingResponse.ok) {
          const errorText = await outgoingResponse.text()
          console.error("Outgoing chart upload failed:", errorText)
          throw new Error(`Outgoing chart upload failed: ${errorText}`)
        } else {
          console.log("Outgoing chart uploaded successfully")
        }
      }

      // 4) Re-fetch task to get updated charts
      // const updated = await fetch(`${process.env.REACT_APP_TASK_DETAILS}${task.task_id}`).then((r) => r.json())

      onUpdate()
      
    } catch (err) {
      console.error("Update error:", err)
      toast.current.show({ severity: "error", summary: "Update failed", detail: err.message })
    } finally {
      setLoading(false)
    }
  }

  const resetIncomingChart = () => {
    const fallback = selectedOrder?.size_chart ? JSON.parse(selectedOrder.size_chart) : {}
    const newData = { ...fallback }
    setIncomingData(newData)
    incomingDataRef.current = newData
  }

  const resetOutgoingChart = () => {
    const fallback = selectedOrder?.size_chart ? JSON.parse(selectedOrder.size_chart) : {}
    const newData = { ...fallback }
    setOutgoingData(newData)
    outgoingDataRef.current = newData
  }

  // List of other tasks for dependency pick
  const available = allTasks.filter((t) => t.task_id !== task.task_id)

  return (
    <Fragment>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="details" title="Task Details">
          <Form onSubmit={handleSubmit}>
            <div style={{ maxHeight: "auto", overflow: "auto" }}>
              {/* Basic Info */}
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Task Name</Form.Label>
                    <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Status</Form.Label>
                    <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Task Unit</Form.Label>
                    <Form.Select value={taskUnit} onChange={(e) => setTaskUnit(e.target.value)}>
                      {TASK_UNITS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Product</Form.Label>
                    <Select
                      value={product ? { label: product, value: product } : null}
                      onChange={(selected) => setProduct(selected ? selected.value : "")}
                      options={(selectedOrder?.types?.split(",") || []).map((p) => ({
                        label: p.trim(),
                        value: p.trim(),
                      }))}
                      placeholder="Select a product"
                      isClearable
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Color</Form.Label>
                    <Select
                      value={color ? { label: color, value: color } : null}
                      onChange={(selected) => setColor(selected ? selected.value : "")}
                      options={(selectedOrder?.colors?.split(",") || []).map((c) => ({
                        label: c.trim(),
                        value: c.trim(),
                      }))}
                      placeholder="Select a color"
                      isClearable
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Task Unit Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={taskUnitName}
                      onChange={(e) => setTaskUnitName(e.target.value)}
                      placeholder="e.g., A, B, C"
                    />
                  </Form.Group>
                </div>
              </div>

              {/* Dependencies */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Dependencies</Form.Label>
                <Select
                  isMulti
                  value={dependencies
                    .map((dep) => {
                      const task = available.find((t) => t.task_id === dep)
                      return task ? { value: task.task_id, label: task.name } : null
                    })
                    .filter(Boolean)}
                  onChange={(selectedOptions) => setDependencies(selectedOptions.map((opt) => opt.value))}
                  options={available.map((t) => ({ value: t.task_id, label: t.name }))}
                  placeholder="Select dependencies"
                  menuPlacement="top"
                />
              </Form.Group>
            </div>
          </Form>
        </Tab>

        <Tab eventKey="incoming" title="📥 Incoming Chart">
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              {incomingData ? (
                <CustomChartComponent
                  data={incomingData}
                  onSubmit={handleIncomingDataChange}
                  chartType="incoming"
                  onResetToOrderChart={resetIncomingChart}
                />
              ) : (
                <Alert variant="info">No incoming chart data available</Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="outgoing" title="📤 Outgoing Chart">
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              {outgoingData ? (
                <CustomChartComponent
                  data={outgoingData}
                  onSubmit={handleOutgoingDataChange}
                  chartType="outgoing"
                  onResetToOrderChart={resetOutgoingChart}
                />
              ) : (
                <Alert variant="info">No outgoing chart data available</Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      <div
        className="d-flex"
        style={{
          alignItems: "center",
          bottom: "0",
          position: "sticky",
          background: "white",
        }}
      >
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Update Task"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Fragment>
  )
}
