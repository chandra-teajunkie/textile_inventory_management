"use client"

import { useState, useRef, useEffect } from "react"
import { Form, Button, Row, Col, Card, Badge, Tabs, Tab } from "react-bootstrap"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import CreatableSelect from "react-select/creatable"
import EnhancedDataGrid from "./createCustomChart"
import { PurchaseOrderUnit } from "../../utils/constants"

function OrderForm({ toast }) {
    const [form, setForm] = useState({
        overallPieces: "",
        types: [], // Changed to array for multi-select
        colors: [], // Changed to array for multi-select
        customer_name: "", // Remains single select
        specialNotes: "",
        orderDate: new Date(),
        startDate: new Date(),
        dueDate: new Date(),
        purchase_unit_notes: Object.values(PurchaseOrderUnit).reduce((acc, unit) => ({ ...acc, [unit]: "" }), {}),
    })

    const [sizeChartData, setSizeChartData] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dropdownOptions, setDropdownOptions] = useState({
        types: [],
        colors: [],
        customer_name: [],
    })

    // State for active notes tab and refs for textareas
    const [activeNoteTab, setActiveNoteTab] = useState(Object.values(PurchaseOrderUnit)[0]);
    const noteTextareaRefs = useRef(new Map());

    // Track toast to prevent duplicates
    const lastToastTimeRef = useRef(0)

    // Fetch dropdown options on component mount
    useEffect(() => {
        fetchDropdownOptions()
    }, [])

    // Effect to focus textarea when activeNoteTab changes
    useEffect(() => {
        if (activeNoteTab && noteTextareaRefs.current.has(activeNoteTab)) {
            noteTextareaRefs.current.get(activeNoteTab).focus();
        }
    }, [activeNoteTab]);

    const fetchDropdownOptions = async () => {
        try {
            // Single endpoint for all dropdown options
            const response = await fetch(process.env.REACT_APP_GET_DROPDOWN_OPTIONS)

            if (response.ok) {
                const data = await response.json()

                // Expected format: { types: [], colors: [], customer_name: [] }
                setDropdownOptions({
                    types: data.types || ["Top", "Bottom", "Pant"],
                    colors: data.colors || ["Red", "Blue", "Green"],
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
            customer_name: form.customer_name,
            purchase_order_date: form.orderDate.toISOString(),
            start_date: form.startDate.toISOString(),
            due_date: form.dueDate.toISOString(),
            special_notes: form.specialNotes,
            task_unit_notes: form.purchase_unit_notes,
        }

        try {
            const formData = new FormData()
            // Backend expects a form field named 'purchase_order' containing a JSON string
            formData.append("purchase_order", JSON.stringify(orderPayload))
            // size_chart_json is accepted by backend as an optional form field
            formData.append("size_chart_json", JSON.stringify(sizeChartData))

            console.log("Order payload:", orderPayload)
            console.log("Size chart data being sent:", sizeChartData)
            console.log("Size chart JSON string:", JSON.stringify(sizeChartData))

            const response = await fetch(process.env.REACT_APP_POST_ALL_ORDERS, {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const result = await response.json()
                // Backend returns purchase_order_id
                showToast("success", "Success", `Order created successfully with ID: ${result.purchase_order_id}`)

                // Reset form
                setForm({
                    overallPieces: "",
                    types: [],
                    colors: [],
                    customer_name: "",
                    specialNotes: "",
                    orderDate: new Date(),
                    startDate: new Date(),
                    dueDate: new Date(),
                    purchase_unit_notes: Object.values(PurchaseOrderUnit).reduce((acc, unit) => ({ ...acc, [unit]: "" }), {}),
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
        // Ensure the data maintains the same order as displayed in UI
        console.log("Received chart data from UI:", json)

        // Create ordered data structure that matches UI column order
        const orderedData = {}

        // Define the expected column order (Item and Color first, then size columns)
        const expectedColumnOrder = ["Item", "Color", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"]

        // Process columns in the expected order
        expectedColumnOrder.forEach((columnKey) => {
            if (json[columnKey]) {
                orderedData[columnKey] = {}

                // Get all row indices and sort them numerically
                const rowIndices = Object.keys(json[columnKey])
                    .map((index) => Number.parseInt(index))
                    .filter((index) => !isNaN(index))
                    .sort((a, b) => a - b)

                // Rebuild the column data with sorted indices
                rowIndices.forEach((originalIndex, newIndex) => {
                    orderedData[columnKey][newIndex] = json[columnKey][originalIndex]
                })
            }
        })

        // Add any additional columns that weren't in the expected order
        Object.keys(json).forEach((columnKey) => {
            if (!expectedColumnOrder.includes(columnKey) && columnKey !== "actions") {
                orderedData[columnKey] = {}

                const rowIndices = Object.keys(json[columnKey])
                    .map((index) => Number.parseInt(index))
                    .filter((index) => !isNaN(index))
                    .sort((a, b) => a - b)

                rowIndices.forEach((originalIndex, newIndex) => {
                    orderedData[columnKey][newIndex] = json[columnKey][originalIndex]
                })
            }
        })

        console.log("Processed chart data for backend (ordered):", orderedData)
        console.log("Column order:", Object.keys(orderedData))
        setSizeChartData(orderedData)
    }

    // Convert arrays to react-select format
    const formatOptionsForSelect = (options) => {
        return options.map((option) => ({ value: option, label: option }))
    }

    const formatValuesForSelect = (values) => {
        return values.map((value) => ({ value, label: value }))
    }

    // Add function to calculate total pieces from size chart
    const calculateTotalPieces = () => {
        // Assuming sizeChart is an array of objects and each row has a 'quantity' field
        if (!sizeChartData || !Array.isArray(sizeChartData)) return 0;
        return Object.values(sizeChartData[Object.keys(sizeChartData)[0]]).reduce((total, quantity) => total + (parseInt(quantity, 10) || 0), 0);
    };

    // New helper functions for size chart totals
    const getRowTotal = (row, sizes) => {
        return sizes.reduce((sum, size) => sum + (parseInt(row[size], 10) || 0), 0);
    };

    const getOverallTotal = (sizeChart, sizes) => {
        return sizeChart.reduce((overall, row) => overall + getRowTotal(row, sizes), 0);
    };

    return (
        <div className="p-4">
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
                                        disabled
                                        value={form.overallPieces}
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

                                <h5 className="mb-3">Purchase Unit Notes</h5>
                                <Tabs activeKey={activeNoteTab} onSelect={(k) => setActiveNoteTab(k)} id="purchase-unit-notes-tabs" className="mb-3">
                                    {Object.values(PurchaseOrderUnit).map((unit) => (
                                        <Tab
                                            eventKey={unit}
                                            title={
                                                <>
                                                    {unit.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                                    {form.purchase_unit_notes[unit] && (
                                                        <Badge pill bg="success" className="ms-2">
                                                            <i className="bi bi-check"></i>
                                                        </Badge>
                                                    )}
                                                </>
                                            }
                                            key={unit}
                                        >
                                            <Form.Group className="mb-3 mt-3">
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    ref={(el) => noteTextareaRefs.current.set(unit, el)} // Assign ref dynamically
                                                    value={form.purchase_unit_notes[unit] || ''}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            purchase_unit_notes: { ...prev.purchase_unit_notes, [unit]: e.target.value },
                                                        }))
                                                    }
                                                    placeholder={`Enter notes for the ${unit.toLowerCase().replace(/_/g, " ")} unit`}
                                                />
                                            </Form.Group>
                                        </Tab>
                                    ))}
                                </Tabs>

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
                        <p className="text-muted mb-4">
                            Create a size chart or upload a file to generate one.
                            {form.types.length > 0 && form.colors.length > 0 && (
                                <span className="fw-bold text-primary">
                                    {" "}
                                    Auto-generating {form.types.length * form.colors.length} rows based on your type-color combinations.
                                </span>
                            )}
                        </p>

                        <div style={{ marginBottom: "20px", overflow: "hidden" }}>
                            <EnhancedDataGrid onSubmit={handleTableSubmit} orderTypes={form.types} orderColors={form.colors}
                                setForm={setForm} form={form} sizeChartData={sizeChartData} />
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
        </div>
    )
}

export default OrderForm
