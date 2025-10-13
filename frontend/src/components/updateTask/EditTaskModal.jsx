"use client"

import { useState, useEffect, Fragment, useRef } from "react"
import { Form, Button, Tab, Tabs, Card, Alert } from "react-bootstrap"
import { parseJsonSafe } from "../../utils/jsonUtils"
import CustomChartComponent from "./CustomChartComponent"
import { FaCut, FaPrint, FaEdit, FaBox, FaQuestion, FaShoppingCart, FaTshirt } from "react-icons/fa"
import { GiSewingMachine } from "react-icons/gi" // Sewing machine icon
import { PurchaseOrderUnit } from "../../utils/constants"
import Select from "react-select"

const STATUS_OPTIONS = [
  { value: "NOT STARTED", label: "Not Started" },
  { value: "IN PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
]

// Build TASK_UNITS from the canonical PurchaseOrderUnit constants so the list
// stays in sync with backend/other code. Provide icons and human-friendly labels.
const _iconMap = {
  [PurchaseOrderUnit.PROCUREMENT]: <FaShoppingCart />,
  [PurchaseOrderUnit.CUTTING]: <FaCut />,
  [PurchaseOrderUnit.COLLAR]: <FaTshirt />,
  [PurchaseOrderUnit.PRINTING]: <FaPrint />,
  [PurchaseOrderUnit.EMBROIDERY]: <FaEdit />,
  [PurchaseOrderUnit.STITCHING]: <GiSewingMachine />,
  [PurchaseOrderUnit.PACKAGING]: <FaBox />,
  [PurchaseOrderUnit.UNASSIGNED]: <FaQuestion />,
}

const TASK_UNITS = Object.values(PurchaseOrderUnit).map((value) => ({
  value,
  // Convert ENUM_NAME to "Enum Name"
  label: value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
  icon: _iconMap[value] || <FaQuestion />,
}))

export function EditTaskModal({ task, selectedOrder, allTasks, onClose, onUpdate, toast, orderPurchaseUnitNotes }) {
  const [name, setName] = useState(task.name)
  const [status, setStatus] = useState(task.status)
  const [taskUnit, setTaskUnit] = useState(task.purchase_order_unit || "UNASSIGNED")
  const [product, setProduct] = useState(task.product || "")
  const [color, setColor] = useState(task.color || "")
  const [dependencies, setDependencies] = useState([])
  const [incomingData, setIncomingData] = useState(null)
  const [outgoingData, setOutgoingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [taskUnitName, setTaskUnitName] = useState(task.purchase_order_unit_name || "")
  const [specialNotes, setSpecialNotes] = useState(task.special_notes || "")

  // Use refs to store the latest chart data
  const incomingDataRef = useRef(null)
  const outgoingDataRef = useRef(null)

  // Parse dependencies once
  useEffect(() => {
    if (task.dependencies) {
      setDependencies(parseJsonSafe(task.dependencies, []))
    }
  }, [task.dependencies])

  // Initialize charts: task's own or fallback to order.size_chart
  useEffect(() => {
    const fallback = selectedOrder?.size_chart ? parseJsonSafe(selectedOrder.size_chart, {}) : {}

    const incoming = task.incoming_chart ? parseJsonSafe(task.incoming_chart, fallback) : fallback
    const outgoing = task.outgoing_chart ? parseJsonSafe(task.outgoing_chart, fallback) : fallback
    console.log(incoming, "incoming", task, selectedOrder)

    // Add chart notes to the data objects
    if (task.incoming_chart_notes) {
      incoming.chartNotes = task.incoming_chart_notes
    }
    if (task.outgoing_chart_notes) {
      outgoing.chartNotes = task.outgoing_chart_notes
    }

    console.log(incoming, "incoming")

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
        purchase_order_unit: taskUnit,
        purchase_order_unit_name: taskUnitName,
        status,
        dependencies: dependencies, // Send as array directly
        special_notes: specialNotes,
        // Save chart notes on the main PATCH endpoint (backend expects these fields there)
        incoming_chart_notes: incomingData?.chartNotes || "",
        outgoing_chart_notes: outgoingData?.chartNotes || "",
      }


      const basic = await fetch(`${process.env.REACT_APP_PATCH_ALL_TASKS}${task.purchase_order_id}`, {
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
        // Make sure we don't send UI-only keys like chartNotes as part of the chart JSON
        const { chartNotes, ...incomingChartOnly } = currentIncomingData
        incomingFormData.append("incoming_chart_json", JSON.stringify(incomingChartOnly))


        const incomingResponse = await fetch(`${process.env.REACT_APP_INCOMING_CHART_UPLOAD}${task.purchase_order_id}`, {
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
        // Strip UI-only keys like chartNotes before sending
        const { chartNotes, ...outgoingChartOnly } = currentOutgoingData
        outgoingFormData.append("outgoing_chart_json", JSON.stringify(outgoingChartOnly))

        const outgoingResponse = await fetch(`${process.env.REACT_APP_OUTGOING_CHART_UPLOAD}${task.purchase_order_id}`, {
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
      // const updated = await fetch(`${process.env.REACT_APP_TASK_DETAILS}${task.purchase_order_id}`).then((r) => r.json())

      onUpdate()

    } catch (err) {
      console.error("Update error:", err)
      toast.current.show({ severity: "error", summary: "Update failed", detail: err.message })
    } finally {
      setLoading(false)
    }
  }

  const resetIncomingChart = () => {
    const fallback = selectedOrder?.size_chart ? parseJsonSafe(selectedOrder.size_chart, {}) : {}
    const newData = { ...fallback }
    // Preserve existing chart notes if they exist
    if (incomingData?.chartNotes) {
      newData.chartNotes = incomingData.chartNotes
    }
    setIncomingData(newData)
    incomingDataRef.current = newData
  }

  const resetOutgoingChart = () => {
    const fallback = selectedOrder?.size_chart ? parseJsonSafe(selectedOrder.size_chart, {}) : {}
    const newData = { ...fallback }
    // Preserve existing chart notes if they exist
    if (outgoingData?.chartNotes) {
      newData.chartNotes = outgoingData.chartNotes
    }
    setOutgoingData(newData)
    outgoingDataRef.current = newData
  }

  // List of other tasks for dependency pick
  const available = allTasks.filter((t) => t.purchase_order_id !== task.purchase_order_id)

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

              {/* Dependencies */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Dependencies</Form.Label>
                <Select
                  isMulti
                  value={dependencies
                    .map((dep) => {
                      const task = available.find((t) => t.purchase_order_id === dep)
                      return task ? { value: task.purchase_order_id, label: task.name } : null
                    })
                    .filter(Boolean)}
                  onChange={(selectedOptions) => setDependencies(selectedOptions.map((opt) => opt.value))}
                  options={available.map((t) => ({ value: t.purchase_order_id, label: t.name }))}
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
                  orderNotes={(parseJsonSafe(orderPurchaseUnitNotes)[taskUnit] || 'No order-level notes for this task.')}
                  specialNotes={specialNotes || 'No special notes for this task.'}
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
                  orderNotes={(parseJsonSafe(orderPurchaseUnitNotes)[taskUnit] || 'No order-level notes for this task.')}
                  specialNotes={specialNotes || 'No special notes for this task.'}
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
