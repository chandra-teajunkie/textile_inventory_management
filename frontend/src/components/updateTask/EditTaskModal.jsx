"use client"

import { useState, useEffect, Fragment } from "react"
import { Form, Button, Tab, Tabs, Card, Alert } from "react-bootstrap"
import CustomChartComponent from "./CustomChartComponent"
import { FaCut, FaPrint, FaEdit, FaBox, FaQuestion } from "react-icons/fa"
import { GiSewingMachine } from 'react-icons/gi'; // Sewing machine icon
import Select from "react-select";

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
  const [taskUnitName, setTaskUnitName] = useState("")

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

    setIncomingData(task.incoming_chart ? JSON.parse(task.incoming_chart) : fallback)
    setOutgoingData(task.outgoing_chart ? JSON.parse(task.outgoing_chart) : fallback)
  }, [task, selectedOrder])

  const handleDependencyChange = (e) => {
    const opts = Array.from(e.target.options)
      .filter((o) => o.selected)
      .map((o) => o.value)
    setDependencies(opts)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.current.show({ severity: "warn", summary: "Name required" })
      return
    }
    setLoading(true)
    try {
      // // 1) PATCH basics using FormData
      // const basicFormData = new FormData()
      // // basicFormData.append("name", name)
      // basicFormData.append("status", status)
      // basicFormData.append("task_unit", taskUnit)
      // // basicFormData.append("product", product)
      // // basicFormData.append("color", color)
      // basicFormData.append("dependencies", dependencies)

      const payload = {
        name: name,
        product,
        color,
        task_unit: taskUnit,
        task_unit_name: taskUnitName,
        status,
        dependencies
      }

      const basic = await fetch(`${process.env.REACT_APP_PATCH_ALL_TASKS}${task.task_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!basic.ok) {
        throw new Error(basic.statusText)
        throw new Error(`Failed to update basic task info: ${basic.status}`)
      }

      // 2) Upload incoming chart if data exists using FormData
      if (incomingData && Object.keys(incomingData).length > 0) {
        const incomingFormData = new FormData()
        incomingFormData.append("incoming_chart_json", JSON.stringify(incomingData))

        const incomingResponse = await fetch(`${process.env.REACT_APP_INCOMING_CHART_UPLOAD}${task.task_id}`, {
          method: "PATCH",
          body: incomingFormData, // No Content-Type header
        })

        if (!incomingResponse.ok) {
          const errorText = await incomingResponse.text()
          console.error("Incoming chart upload failed:", errorText)
          throw new Error(`Incoming chart upload failed: ${errorText}`)
        }
      }

      // 3) Upload outgoing chart if data exists using FormData
      if (outgoingData && Object.keys(outgoingData).length > 0) {
        const outgoingFormData = new FormData()
        outgoingFormData.append("outgoing_chart_json", JSON.stringify(outgoingData))

        const outgoingResponse = await fetch(`${process.env.REACT_APP_OUTGOING_CHART_UPLOAD}${task.task_id}`, {
          method: "PATCH",
          body: outgoingFormData, // No Content-Type header
        })

        if (!outgoingResponse.ok) {
          const errorText = await outgoingResponse.text()
          console.error("Outgoing chart upload failed:", errorText)
          throw new Error(`Outgoing chart upload failed: ${errorText}`)
        }
      }

      // 4) Re-fetch task to get updated charts
      const updated = await fetch(`${process.env.REACT_APP_TASK_DETAILS}${task.task_id}`).then((r) => r.json())

      onUpdate(updated)
      // toast.current.show({
      //   severity: "success",
      //   summary: "Success",
      //   detail: "Task updated successfully",
      // })
    } catch (err) {
      console.error("Update error:", err)
      toast.current.show({ severity: "error", summary: "Update failed", detail: err.message })
    } finally {
      setLoading(false)
    }
  }

  const resetIncomingChart = () => {
    console.log(JSON.parse(selectedOrder?.size_chart))
    const fallback = selectedOrder?.size_chart ? JSON.parse(selectedOrder.size_chart) : {}
    setIncomingData({ ...fallback }) // Create new object to trigger re-render
  }

  const resetOutgoingChart = () => {
    console.log(JSON.parse(selectedOrder?.size_chart))
    const fallback = selectedOrder?.size_chart ? JSON.parse(selectedOrder.size_chart) : {}
    setOutgoingData({ ...fallback }) // Create new object to trigger re-render
  }

  // List of other tasks for dependency pick
  const available = allTasks.filter((t) => t.task_id !== task.task_id)

  return (
    <Fragment>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="details" title="Task Details">
          <Form>
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
                      isMulti
                      value={(product || "").split(", ").filter(Boolean).map(p => ({ label: p, value: p }))}
                      onChange={(selected) => setProduct(selected.map(o => o.value).join(", "))}
                      options={(selectedOrder?.types?.split(",") || []).map(p => ({ label: p.trim(), value: p.trim() }))}
                      placeholder="Select product(s)"
                    />
                  </Form.Group>
                  {/* <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Product</Form.Label>
                    <Form.Control
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="e.g., Shirt, Pants, Dress"
                    />
                  </Form.Group> */}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
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
                    <Form.Label className="fw-bold">Color</Form.Label>
                    <Form.Control
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g., Red, Blue, Green"
                    />
                  </Form.Group> */}
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
                  value={dependencies.map(dep => {
                    const task = available.find(t => t.task_id === dep)
                    return task ? { value: task.task_id, label: task.name } : null
                  }).filter(Boolean)}
                  onChange={selectedOptions => setDependencies(selectedOptions.map(opt => opt.value))}
                  options={available.map(t => ({ value: t.task_id, label: t.name }))}
                  placeholder="Select Dependencie(s)"
                  menuPlacement="top"
                />
                {/* <Form.Select multiple value={dependencies} onChange={handleDependencyChange} style={{ height: 120 }}>
                {available.map((t) => (
                  <option key={t.task_id} value={t.task_id}>
                    {t.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Ctrl/Cmd+click to multi-select</Form.Text> */}
              </Form.Group>
            </div>
            {/* Actions */}
            {/* <div className="d-flex justify-content-end gap-2 mt-4"> */}
            <div className="d-flex"
              style={{
                // justifyContent: "space-between",
                alignItems: "center",
                bottom: "0",
                position: "sticky",
                background: "white",
                // maxHeight: "20%"
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
          </Form>
        </Tab>

        <Tab eventKey="incoming" title="📥 Incoming Chart">
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              {incomingData ? (
                <CustomChartComponent
                  data={incomingData}
                  onSubmit={setIncomingData}
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
                  onSubmit={setOutgoingData}
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
    </Fragment>
  )
}
