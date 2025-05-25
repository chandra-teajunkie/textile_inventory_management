"use client"

import { useState, useRef, useEffect } from "react"
import { Form, Button, Row, Col, Card, Badge } from "react-bootstrap"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import CreatableSelect from "react-select/creatable"
import EnhancedDataGrid from "./createCustomChart"

function OrderForm({ toast }) {
    const [form, setForm] = useState({
        overallPieces: "",
        types: [], // Changed to array for multi-select
        colors: [], // Changed to array for multi-select
        design_specs: [], // Changed to array for multi-select
        customer_name: "", // Remains single select
        specialNotes: "",
        orderDate: new Date(),
        startDate: new Date(),
        dueDate: new Date(),
    })

    const [sizeChartData, setSizeChartData] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dropdownOptions, setDropdownOptions] = useState({
        types: [],
        colors: [],
        design_specs: [],
        customer_name: [],
    })

    // Track toast to prevent duplicates
    const lastToastTimeRef = useRef(0)

    // Fetch dropdown options on component mount
    useEffect(() => {
        fetchDropdownOptions()
    }, [])

    const fetchDropdownOptions = async () => {
        try {
            // Single endpoint for all dropdown options
            const response = await fetch(process.env.REACT_APP_GET_DROPDOWN_OPTIONS)

            if (response.ok) {
                const data = await response.json()

                // Expected format: { types: [], colors: [], design_specs: [], customer_name: [] }
                setDropdownOptions({
                    types: data.types || ["Top", "Bottom", "Pant"],
                    colors: data.colors || ["Red", "Blue", "Green"],
                    design_specs: data.design_specs || data.design_specs || ["Floral", "Plain", "Striped"],
                    customer_name: data.customer_name || ["CUST001", "CUST002", "CUST003"],
                })
            } else {
                throw new Error("Failed to fetch dropdown options")
            }
        } catch (error) {
            console.error("Error fetching dropdown options:", error)
            // Use fallback data if API fails
            setDropdownOptions({
                types: ["Top", "Bottom", "Pant"],
                colors: ["Red", "Blue", "Green"],
                design_specs: ["Floral", "Plain", "Striped"],
                customer_name: ["CUST001", "CUST002", "CUST003"],
            })
        }
    }

    const postCustomLabel = async (value, type) => {
        try {
            // Single endpoint for posting custom labels
            const formData = new FormData()
            formData.append("label", value)
            formData.append("type", type) // Specify which dropdown type

            const response = await fetch(process.env.REACT_APP_POST_CUSTOM_LABEL, {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                // Refresh dropdown options after successful post
                await fetchDropdownOptions()
                showToast("success", "Custom Label Added", `"${value}" has been added to ${type}`)
            } else {
                throw new Error("Failed to post custom label")
            }
        } catch (error) {
            console.error(`Error posting custom ${type}:`, error)
            showToast("error", "Error", `Failed to add custom ${type}`)
        }
    }

    const showToast = (severity, summary, detail) => {
        const now = Date.now()
        if (now - lastToastTimeRef.current > 2000) {
            // Prevent duplicate toasts within 2 seconds
            lastToastTimeRef.current = now
            toast.current.show({
                severity,
                summary,
                detail,
                life: 3000,
            })
        }
    }

    const handleMultiSelectChange = (field, selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map((option) => option.value) : []
        setForm((prev) => ({ ...prev, [field]: values }))
    }

    const handleSingleSelectChange = (field, selectedOption) => {
        const value = selectedOption ? selectedOption.value : ""
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleCreateOption = async (inputValue, field) => {
        // Add to local state immediately for better UX
        setDropdownOptions((prev) => ({
            ...prev,
            [field]: [...prev[field], inputValue],
        }))

        // Post to backend
        // await postCustomLabel(inputValue, field)

        // Update form state
        if (field === "customer_name") {
            handleSingleSelectChange(field, { value: inputValue, label: inputValue })
        } else {
            const currentValues = form[field] || []
            setForm((prev) => ({ ...prev, [field]: [...currentValues, inputValue] }))
        }
    }

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const validateForm = () => {
        const emptyFields = []

        // Check required fields
        if (!form.overallPieces || form.overallPieces.trim() === "") emptyFields.push("overallPieces")
        if (!form.types || form.types.length === 0) emptyFields.push("types")
        if (!form.colors || form.colors.length === 0) emptyFields.push("colors")
        if (!form.design_specs || form.design_specs.length === 0) emptyFields.push("design_specs")
        if (!form.customer_name || form.customer_name.trim() === "") emptyFields.push("customer_name")
        if (!form.specialNotes || form.specialNotes.trim() === "") emptyFields.push("specialNotes")

        if (emptyFields.length > 0) {
            showToast("warn", "Missing Fields", `Please fill in all required fields: ${emptyFields.join(", ")}`)
            return false
        }

        if (!sizeChartData) {
            showToast("warn", "Missing Size Chart", "Please create or upload a Size Chart")
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
            types: form.types.join(", "), // Join with commas
            colors: form.colors.join(", "), // Join with commas
            design_specs: form.design_specs.join(", "), // Join with commas
            customer_name: form.customer_name,
            order_date: form.orderDate.toISOString(),
            start_date: form.startDate.toISOString(),
            due_date: form.dueDate.toISOString(),
            special_notes: form.specialNotes,
        }

        try {
            const formData = new FormData()
            formData.append("order", JSON.stringify(orderPayload))
            formData.append("size_chart_json", JSON.stringify(sizeChartData))

            const response = await fetch(process.env.REACT_APP_POST_ALL_ORDERS, {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const result = await response.json()
                showToast("success", "Success", `Order created successfully with ID: ${result.order_id}`)

                // Reset form
                setForm({
                    overallPieces: "",
                    types: [],
                    colors: [],
                    design_specs: [],
                    customer_name: "",
                    specialNotes: "",
                    orderDate: new Date(),
                    startDate: new Date(),
                    dueDate: new Date(),
                })
                setSizeChartData(null)
            } else {
                const errorData = await response.json()
                showToast("error", "Error", errorData.message || "Failed to create order")
            }
        } catch (err) {
            console.error("Error creating order:", err)
            showToast("error", "Error", "Network or server error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleTableSubmit = (json) => {
        setSizeChartData(json)
    }

    // Convert arrays to react-select format
    const formatOptionsForSelect = (options) => {
        return options.map((option) => ({ value: option, label: option }))
    }

    const formatValuesForSelect = (values) => {
        return values.map((value) => ({ value, label: value }))
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
                                    <Form.Label>Number of Pieces *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={form.overallPieces}
                                        onChange={(e) => handleChange("overallPieces", e.target.value)}
                                        placeholder="Enter total pieces"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Types * (Multi-select)</Form.Label>
                                    <CreatableSelect
                                        isMulti
                                        isClearable
                                        placeholder="Select or enter types"
                                        value={formatValuesForSelect(form.types)}
                                        onChange={(selectedOptions) => handleMultiSelectChange("types", selectedOptions)}
                                        onCreateOption={(inputValue) => handleCreateOption(inputValue, "types")}
                                        options={formatOptionsForSelect(dropdownOptions.types)}
                                    />
                                    {form.types.length > 0 && (
                                        <div className="mt-2">
                                            <small className="text-muted">Selected: </small>
                                            {form.types.map((type, index) => (
                                                <Badge key={index} bg="primary" className="me-1">
                                                    {type}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Colors * (Multi-select)</Form.Label>
                                    <CreatableSelect
                                        isMulti
                                        isClearable
                                        placeholder="Select or enter colors"
                                        value={formatValuesForSelect(form.colors)}
                                        onChange={(selectedOptions) => handleMultiSelectChange("colors", selectedOptions)}
                                        onCreateOption={(inputValue) => handleCreateOption(inputValue, "colors")}
                                        options={formatOptionsForSelect(dropdownOptions.colors)}
                                    />
                                    {form.colors.length > 0 && (
                                        <div className="mt-2">
                                            <small className="text-muted">Selected: </small>
                                            {form.colors.map((color, index) => (
                                                <Badge key={index} bg="success" className="me-1">
                                                    {color}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Design Specifications * (Multi-select)</Form.Label>
                                    <CreatableSelect
                                        isMulti
                                        isClearable
                                        placeholder="Select or enter design specs"
                                        value={formatValuesForSelect(form.design_specs)}
                                        onChange={(selectedOptions) => handleMultiSelectChange("design_specs", selectedOptions)}
                                        onCreateOption={(inputValue) => handleCreateOption(inputValue, "design_specs")}
                                        options={formatOptionsForSelect(dropdownOptions.design_specs)}
                                    />
                                    {form.design_specs.length > 0 && (
                                        <div className="mt-2">
                                            <small className="text-muted">Selected: </small>
                                            {form.design_specs.map((spec, index) => (
                                                <Badge key={index} bg="warning" className="me-1">
                                                    {spec}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Name * (Single select)</Form.Label>
                                    <CreatableSelect
                                        isClearable
                                        placeholder="Select or enter customer name"
                                        value={form.customer_name ? { label: form.customer_name, value: form.customer_name } : null}
                                        onChange={(selectedOption) => handleSingleSelectChange("customer_name", selectedOption)}
                                        onCreateOption={(inputValue) => handleCreateOption(inputValue, "customer_name")}
                                        options={formatOptionsForSelect(dropdownOptions.customer_name)}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Special Notes *</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={form.specialNotes}
                                        onChange={(e) => handleChange("specialNotes", e.target.value)}
                                        placeholder="Enter any special instructions"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Order Date *</Form.Label>
                                    <DatePicker
                                        selected={form.orderDate}
                                        onChange={(date) => handleChange("orderDate", date)}
                                        className="form-control"
                                        dateFormat="MMMM d, yyyy"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Start Date *</Form.Label>
                                    <DatePicker
                                        selected={form.startDate}
                                        onChange={(date) => handleChange("startDate", date)}
                                        className="form-control"
                                        dateFormat="MMMM d, yyyy"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Due Date *</Form.Label>
                                    <DatePicker
                                        selected={form.dueDate}
                                        onChange={(date) => handleChange("dueDate", date)}
                                        className="form-control"
                                        dateFormat="MMMM d, yyyy"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />

                        <h5 className="mb-3">Size Chart *</h5>
                        <p className="text-muted mb-4">Create a size chart or upload a file to generate one</p>

                        <div className="size-chart-container">
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
          overflow: hidden;
        }
      `}</style>
        </div>
    )
}

export default OrderForm
