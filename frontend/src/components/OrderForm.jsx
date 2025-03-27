"use client"

import { useState } from "react"
import { Form, Button, Row, Col, Card } from "react-bootstrap"
import DatePicker from "react-datepicker"
import * as XLSX from "xlsx"
import "react-datepicker/dist/react-datepicker.css"
import SizeChart from './SizeChartPreview'

function OrderForm({ toast }) {
  const [form, setForm] = useState({
    overallPieces: "",
    type: "",
    color: "",
    designSpec: "",
    customerId: "",
    specialNotes: "",
    orderDate: new Date(),
    startDate: new Date(),
    dueDate: new Date(),
  })

  const [sizeChartData, setSizeChartData] = useState([])
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [dropdownOptions] = useState({
    types: ["Top", "Bottom", "Pant"],
    colors: ["Red", "Blue", "Green"],
    specs: ["Floral", "Plain", "Striped"],
    customers: ["CUST001", "CUST002", "CUST003"],
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadedFile(file)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: "array" })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      setSizeChartData(jsonData)
    }
    reader.readAsArrayBuffer(file)
  }

  const validateForm = () => {
    const emptyFields = []

    Object.entries(form).forEach(([key, value]) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        emptyFields.push(key)
      }
    })

    if (emptyFields.length > 0) {
      toast.current.show({
        severity: "warn",
        summary: "Missing Fields",
        detail: `Please fill in all required fields: ${emptyFields.join(", ")}`,
        life: 3000,
      })
      return false
    }

    if (!uploadedFile) {
      toast.current.show({
        severity: "warn",
        summary: "Missing File",
        detail: "Please upload a Size Chart file",
        life: 3000,
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const orderPayload = {
      number_of_overall_pieces: Number.parseInt(form.overallPieces),
      types: form.type,
      colors: form.color,
      design_specs: form.designSpec,
      customer_id: form.customerId,
      order_date: form.orderDate.toISOString(),
      start_date: form.startDate.toISOString(),
      due_date: form.dueDate.toISOString(),
      special_notes: form.specialNotes,
    }

    const formData = new FormData()
    formData.append("order", JSON.stringify(orderPayload))
    formData.append("size_chart_file", uploadedFile)

    try {
      const response = await fetch(process.env.REACT_APP_POST_ALL_ORDERS, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: `Order created successfully with ID: ${result.order_id}`,
          life: 3000,
        })

        // Reset form
        setForm({
          overallPieces: "",
          type: "",
          color: "",
          designSpec: "",
          customerId: "",
          specialNotes: "",
          orderDate: new Date(),
          startDate: new Date(),
          dueDate: new Date(),
        })
        setSizeChartData([])
        setUploadedFile(null)
      } else {
        const errorData = await response.json()
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: errorData.message || "Failed to create order",
          life: 3000,
        })
      }
    } catch (err) {
      console.error("Error creating order:", err)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Network or server error occurred",
        life: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">Create Order</h1>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white">
          <Card.Title>Order Details</Card.Title>
          <Card.Subtitle className="text-muted">Enter order information and upload size chart</Card.Subtitle>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Pieces</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.overallPieces}
                    onChange={(e) => handleChange("overallPieces", e.target.value)}
                    placeholder="Enter total pieces"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
                    <option value="">Select type</option>
                    {dropdownOptions.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </Form.Select>
                  {form.type === "custom" && (
                    <Form.Control
                      type="text"
                      className="mt-2"
                      placeholder="Enter custom type"
                      onChange={(e) => handleChange("type", e.target.value)}
                    />
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Select value={form.color} onChange={(e) => handleChange("color", e.target.value)}>
                    <option value="">Select color</option>
                    {dropdownOptions.colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </Form.Select>
                  {form.color === "custom" && (
                    <Form.Control
                      type="text"
                      className="mt-2"
                      placeholder="Enter custom color"
                      onChange={(e) => handleChange("color", e.target.value)}
                    />
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Design Specification</Form.Label>
                  <Form.Select value={form.designSpec} onChange={(e) => handleChange("designSpec", e.target.value)}>
                    <option value="">Select specification</option>
                    {dropdownOptions.specs.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </Form.Select>
                  {form.designSpec === "custom" && (
                    <Form.Control
                      type="text"
                      className="mt-2"
                      placeholder="Enter custom specification"
                      onChange={(e) => handleChange("designSpec", e.target.value)}
                    />
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Customer ID</Form.Label>
                  <Form.Select value={form.customerId} onChange={(e) => handleChange("customerId", e.target.value)}>
                    <option value="">Select customer</option>
                    {dropdownOptions.customers.map((customer) => (
                      <option key={customer} value={customer}>
                        {customer}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Special Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.specialNotes}
                    onChange={(e) => handleChange("specialNotes", e.target.value)}
                    placeholder="Enter any special instructions"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Order Date</Form.Label>
                  <DatePicker
                    selected={form.orderDate}
                    onChange={(date) => handleChange("orderDate", date)}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <DatePicker
                    selected={form.startDate}
                    onChange={(date) => handleChange("startDate", date)}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <DatePicker
                    selected={form.dueDate}
                    onChange={(date) => handleChange("dueDate", date)}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            <Form.Group className="mb-3">
              <Form.Label>Size Chart</Form.Label>
              <Form.Control type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
              <Form.Text className="text-muted">Upload a CSV or Excel file with size chart details</Form.Text>
            </Form.Group>

            {sizeChartData.length > 0 && (
              <SizeChart data={sizeChartData} />
              // <div className="table-responsive mt-3 mb-3 border rounded">
              //   <table className="table table-striped table-hover mb-0">
              //     <thead>
              //       <tr>
              //         {Object.keys(sizeChartData[0]).map((header) => (
              //           <th key={header}>{header}</th>
              //         ))}
              //       </tr>
              //     </thead>
              //     <tbody>
              //       {sizeChartData.map((row, rowIndex) => (
              //         <tr key={rowIndex}>
              //           {Object.values(row).map((value, colIndex) => (
              //             <td key={colIndex}>{value}</td>
              //           ))}
              //         </tr>
              //       ))}
              //     </tbody>
              //   </table>
              // </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <Button variant="primary" type="submit" disabled={isSubmitting} className="px-4">
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Order"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default OrderForm

