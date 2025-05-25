"use client"

import { useState, useRef, useEffect } from "react"
import { Form, Button, Row, Col, Card } from "react-bootstrap"
import DatePicker from "react-datepicker"
import * as XLSX from "xlsx"
import "react-datepicker/dist/react-datepicker.css"
import CreatableSelect from "react-select/creatable"
import EnhancedDataGrid from "./createCustomChart"

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

    const [sizeChartData, setSizeChartData] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [csvHeader, setCSVHeader] = useState([])
    const gridContainerRef = useRef(null)

    const [dropdownOptions, setDropdownOptions] = useState({
        types: ["Top", "Bottom", "Pant"],
        colors: ["Red", "Blue", "Green"],
        specs: ["Floral", "Plain", "Striped"],
        customers: ["CUST001", "CUST002", "CUST003"],
    })

    // Fix for ResizeObserver error - add cleanup for any observers
    useEffect(() => {
        return () => {
            // This empty cleanup function helps prevent ResizeObserver errors
            // when the component unmounts during an active resize observation
        }
    }, [])

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))

        const fieldMap = {
            type: "types",
            color: "colors",
            designSpec: "specs",
            customerId: "customers",
        }

        const key = fieldMap[field]

        if (key && value && !dropdownOptions[key]?.includes(value)) {
            setDropdownOptions((prev) => ({
                ...prev,
                [key]: Array.isArray(prev[key]) ? [...prev[key], value] : [value],
            }))
        }
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

        // Updated validation - check for size chart data instead of file
        if (!sizeChartData) {
            toast.current.show({
                severity: "warn",
                summary: "Missing Size Chart",
                detail: "Please create or upload a Size Chart",
                life: 3000,
            })
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

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

        try {
            // Create FormData
            const formData = new FormData()

            // Add order data
            formData.append("order", JSON.stringify(orderPayload))

            // Add size chart JSON instead of file
            formData.append("size_chart_json", JSON.stringify(sizeChartData))

            // If file is still needed for backward compatibility
            if (uploadedFile) {
                formData.append("size_chart_file", uploadedFile)
            }

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
                setSizeChartData(null)
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

    const handleTableSubmit = (json) => {
        // console.log("Table JSON →", JSON.stringify(json))
        // Store the JSON data directly
        setSizeChartData(json)
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 fw-bold">Create Order</h1>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                    <Card.Title>Order Details</Card.Title>
                    <Card.Subtitle className="text-muted">Enter order info and create size chart</Card.Subtitle>
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
                                    <CreatableSelect
                                        isClearable
                                        placeholder="Select or enter a type"
                                        onChange={(val) => handleChange("type", val ? val.value : "")}
                                        options={dropdownOptions.types.map((t) => ({ value: t, label: t }))}
                                        value={form.type ? { label: form.type, value: form.type } : null}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Color</Form.Label>
                                    <CreatableSelect
                                        isClearable
                                        placeholder="Select or enter a color"
                                        onChange={(val) => handleChange("color", val ? val.value : "")}
                                        options={dropdownOptions.colors.map((t) => ({ value: t, label: t }))}
                                        value={form.color ? { label: form.color, value: form.color } : null}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Design Specification</Form.Label>
                                    <CreatableSelect
                                        isClearable
                                        placeholder="Select or enter a design spec"
                                        onChange={(val) => handleChange("designSpec", val ? val.value : "")}
                                        options={dropdownOptions.specs.map((t) => ({ value: t, label: t }))}
                                        value={form.designSpec ? { label: form.designSpec, value: form.designSpec } : null}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Customer ID</Form.Label>
                                    <CreatableSelect
                                        isClearable
                                        placeholder="Select or enter customer ID"
                                        onChange={(val) => handleChange("customerId", val ? val.value : "")}
                                        options={dropdownOptions.customers.map((t) => ({ value: t, label: t }))}
                                        value={form.customerId ? { label: form.customerId, value: form.customerId } : null}
                                    />
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

                        <h5 className="mb-3">Size Chart</h5>
                        <p className="text-muted mb-4">Create a size chart or upload a file to generate one</p>

                        {/* <div className="mb-3">
                            <Form.Label>Upload Size Chart (Optional)</Form.Label>
                            <Form.Control type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                            <Form.Text className="text-muted">Upload a CSV or Excel file with size chart details</Form.Text>
                        </div> */}

                        <div ref={gridContainerRef} className="size-chart-container">
                            <EnhancedDataGrid onSubmit={handleTableSubmit} />
                        </div>

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

            <style jsx>{`
                .size-chart-container {
                    margin-bottom: 20px;
                    overflow: hidden; /* Helps with ResizeObserver issues */
                }
            `}</style>
        </div>
    )
}

export default OrderForm
