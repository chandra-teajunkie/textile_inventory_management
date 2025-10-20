"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
    Card,
    Button,
    Row,
    Col,
    Badge,
    Table,
    Form,
    Spinner,
    Dropdown,
    Tabs,
    Tab,
    ProgressBar,
    Alert,
} from "react-bootstrap"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import {
    FaFileCsv,
    FaFilePdf,
    FaPrint,
    FaChevronDown,
    FaChevronRight,
    FaCut,
    FaEdit,
    FaBox,
    FaQuestion,
    FaPrint as FaPrintIcon,
    FaSearch,
    FaFilter,
    FaChartBar,
    FaTasks,
    FaCalendarAlt,
    FaUser,
    FaClipboardList,
    FaExclamationTriangle,
    FaCheckCircle,
    FaClock,
    FaPlay,
} from "react-icons/fa"
import { GiSewingMachine, GiHeavyCollar } from "react-icons/gi"
import { TbHttpGet } from "react-icons/tb"
import { parseJsonSafe } from "../utils/jsonUtils"

// --- Constants and Helper Functions ---
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
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered"]
const TASK_STATUSES = ["NOT STARTED", "IN PROGRESS", "COMPLETED", "BLOCKED"]

const getOrderStatusVariant = (status) => {
    const mapping = {
        Processing: "warning",
        Shipped: "primary",
        Delivered: "success",
        Pending: "danger",
    }
    return mapping[status] || "secondary"
}

const getTaskStatusVariant = (status) => {
    const mapping = {
        "IN PROGRESS": "warning",
        COMPLETED: "success",
        BLOCKED: "danger",
        "NOT STARTED": "secondary",
    }
    return mapping[status] || "light"
}

const getTaskUnitVariant = (unit) => {
    const mapping = {
        PROCUREMENT: "primary",
        COLLAR: "secondary",
        CUTTING: "danger",
        PRINTING: "info",
        EMBROIDERY: "warning",
        STITCHING: "success",
        PACKAGING: "dark",
        UNASSIGNED: "light",
    }
    return mapping[unit] || "light"
}

const getTaskUnitIcon = (unit) => {
    switch (unit) {
        case "PROCUREMENT":
            return <TbHttpGet className="me-1" />
        case "COLLAR":
            return <GiHeavyCollar className="me-1" />
        case "CUTTING":
            return <FaCut className="me-1" />
        case "PRINTING":
            return <FaPrintIcon className="me-1" />
        case "EMBROIDERY":
            return <FaEdit className="me-1" />
        case "STITCHING":
            return <GiSewingMachine className="me-1" />
        case "PACKAGING":
            return <FaBox className="me-1" />
        default:
            return <FaQuestion className="me-1" />
    }
}

const getStatusIcon = (status) => {
    switch (status) {
        case "COMPLETED":
            return <FaCheckCircle className="me-1" />
        case "IN PROGRESS":
            return <FaPlay className="me-1" />
        case "BLOCKED":
            return <FaExclamationTriangle className="me-1" />
        case "NOT STARTED":
            return <FaClock className="me-1" />
        default:
            return <FaClock className="me-1" />
    }
}

// --- KPI Cards Component ---
const KpiCards = ({ orders, tasks }) => {
    const taskStatusCounts = useMemo(() => {
        return tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1
            return acc
        }, {})
    }, [tasks])

    const orderStatusCounts = useMemo(() => {
        return orders.reduce((acc, order) => {
            const status = order.status || "Processing"
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {})
    }, [orders])

    const completionRate = useMemo(() => {
        if (tasks.length === 0) return 0
        return Math.round(((taskStatusCounts.COMPLETED || 0) / tasks.length) * 100)
    }, [tasks.length, taskStatusCounts.COMPLETED])

    const urgentTasks = useMemo(() => {
        return tasks.filter((task) => task.status === "BLOCKED" || task.status === "IN PROGRESS").length
    }, [tasks])

    return (
        <Row className="g-3 mb-4">
            <Col md={6} lg={3}>
                <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="d-flex align-items-center">
                        <div className="flex-grow-1">
                            <div className="text-muted small mb-1">
                                <FaClipboardList className="me-1" />
                                Total Orders
                            </div>
                            <div className="h3 fw-bold text-primary mb-0">{orders.length}</div>
                            <div className="small text-success">
                                <FaCheckCircle className="me-1" />
                                {orderStatusCounts.Delivered || 0} delivered
                            </div>
                        </div>
                        <div className="text-primary opacity-25">
                            <FaClipboardList size={40} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            <Col md={6} lg={3}>
                <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="d-flex align-items-center">
                        <div className="flex-grow-1">
                            <div className="text-muted small mb-1">
                                <FaTasks className="me-1" />
                                Total Tasks
                            </div>
                            <div className="h3 fw-bold text-info mb-0">{tasks.length}</div>
                            <div className="small text-warning">
                                <FaPlay className="me-1" />
                                {taskStatusCounts["IN PROGRESS"] || 0} in progress
                            </div>
                        </div>
                        <div className="text-info opacity-25">
                            <FaTasks size={40} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            <Col md={6} lg={3}>
                <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="d-flex align-items-center">
                        <div className="flex-grow-1">
                            <div className="text-muted small mb-1">
                                <FaChartBar className="me-1" />
                                Completion Rate
                            </div>
                            <div className="h3 fw-bold text-success mb-0">{completionRate}%</div>
                            <ProgressBar now={completionRate} variant="success" style={{ height: "4px" }} className="mt-1" />
                        </div>
                        <div className="text-success opacity-25">
                            <FaChartBar size={40} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            <Col md={6} lg={3}>
                <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="d-flex align-items-center">
                        <div className="flex-grow-1">
                            <div className="text-muted small mb-1">
                                <FaExclamationTriangle className="me-1" />
                                Urgent Tasks
                            </div>
                            <div className="h3 fw-bold text-warning mb-0">{urgentTasks}</div>
                            <div className="small text-danger">
                                <FaExclamationTriangle className="me-1" />
                                {taskStatusCounts.BLOCKED || 0} blocked
                            </div>
                        </div>
                        <div className="text-warning opacity-25">
                            <FaExclamationTriangle size={40} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
}

// --- Task Unit Visualization Component ---
const TaskUnitVisualization = ({ tasks = [] }) => {
    const unitStats = useMemo(() => {
        const stats = {}
        TASK_UNITS.forEach((unit) => {
            const unitTasks = tasks.filter((task) => task.task_unit === unit)
            const completed = unitTasks.filter((task) => task.status === "COMPLETED").length
            const inProgress = unitTasks.filter((task) => task.status === "IN PROGRESS").length
            const blocked = unitTasks.filter((task) => task.status === "BLOCKED").length
            const notStarted = unitTasks.filter((task) => task.status === "NOT STARTED").length

            stats[unit] = {
                total: unitTasks.length,
                completed,
                inProgress,
                blocked,
                notStarted,
                completionRate: unitTasks.length > 0 ? Math.round((completed / unitTasks.length) * 100) : 0,
                tasks: unitTasks,
            }
        })
        return stats
    }, [tasks])

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
                <div className="d-flex align-items-center">
                    <FaChartBar className="me-2 text-primary" />
                    <Card.Title as="h5" className="mb-0">
                        Task Progress by Production Unit
                    </Card.Title>
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-4">
                    {TASK_UNITS.map((unit) => {
                        const stats = unitStats[unit]
                        return (
                            <Col key={unit} md={6} xl={4}>
                                <Card className="h-100 border">
                                    <Card.Header className={`bg-${getTaskUnitVariant(unit)} text-white`}>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center">
                                                {getTaskUnitIcon(unit)}
                                                <span className="fw-bold">{unit}</span>
                                            </div>
                                            <Badge bg="light" text="dark">
                                                {stats.total}
                                            </Badge>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="p-3">
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <small className="fw-bold">Progress</small>
                                                <small className="fw-bold">{stats.completionRate}%</small>
                                            </div>
                                            <ProgressBar
                                                now={stats.completionRate}
                                                variant={
                                                    stats.completionRate === 100 ? "success" : stats.completionRate > 50 ? "warning" : "danger"
                                                }
                                                style={{ height: "8px" }}
                                            />
                                        </div>

                                        {stats.total > 0 && (
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {stats.completed > 0 && (
                                                    <Badge bg="success" className="small">
                                                        {stats.completed} Done
                                                    </Badge>
                                                )}
                                                {stats.inProgress > 0 && (
                                                    <Badge bg="warning" className="small">
                                                        {stats.inProgress} Active
                                                    </Badge>
                                                )}
                                                {stats.blocked > 0 && (
                                                    <Badge bg="danger" className="small">
                                                        {stats.blocked} Blocked
                                                    </Badge>
                                                )}
                                                {stats.notStarted > 0 && (
                                                    <Badge bg="secondary" className="small">
                                                        {stats.notStarted} Pending
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {stats.total === 0 && (
                                            <div className="text-center text-muted py-2">
                                                <small>No tasks assigned</small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            </Card.Body>
        </Card>
    )
}

// --- Main Consolidated View Component ---
const ConsolidatedOverview = ({ toast }) => {
    // State Management
    const [allData, setAllData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filtering state
    const [filterOrderStatus, setFilterOrderStatus] = useState("all")
    const [filterTaskStatus, setFilterTaskStatus] = useState("all")
    const [filterTaskUnit, setFilterTaskUnit] = useState("all")
    const [filterCustomer, setFilterCustomer] = useState("")
    const [dateRange, setDateRange] = useState({ start: "", end: "" })

    // UI State
    const [expandedOrders, setExpandedOrders] = useState({})
    const [activeTab, setActiveTab] = useState("overview")
    const [showFilters, setShowFilters] = useState(false)

    // Data Fetching
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true)
            setError(null)
            try {
                // Fetch all orders
                const ordersRes = await fetch(process.env.REACT_APP_GET_ALL_ORDERS)
                if (!ordersRes.ok) throw new Error("Failed to fetch orders")
                let orders = await ordersRes.json()
                orders = orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))

                // Fetch tasks for each order
                const tasksPromises = orders.map((order) =>
                    fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${order.order_id || order.purchase_order_id || order.id}`)
                        .then((res) => (res.ok ? res.json() : []))
                        .catch(() => []),
                )

                const tasksResults = await Promise.all(tasksPromises)

                // Combine orders and tasks
                const combinedData = orders.map((order, index) => ({
                    ...order,
                    tasks: tasksResults[index] || [],
                }))

                setAllData(combinedData)
            } catch (err) {
                setError(err.message)
                console.error(err)
                if (toast?.current) {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load data.",
                        life: 3000,
                    })
                }
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [toast])

    // Filtering Logic
    const filteredData = useMemo(() => {
        return allData
            .map((order) => {
                // Filter tasks first
                const tasks = order.tasks.filter((task) => {
                    const taskStatusMatch = filterTaskStatus === "all" || task.status === filterTaskStatus
                    const taskUnitMatch = filterTaskUnit === "all" || task.task_unit === filterTaskUnit
                    return taskStatusMatch && taskUnitMatch
                })

                return { ...order, tasks }
            })
            .filter((order) => {
                // Filter orders
                const orderStatusMatch = filterOrderStatus === "all" || (order.status || "Processing") === filterOrderStatus
                const customerMatch =
                    !filterCustomer || order.customer_name.toLowerCase().includes(filterCustomer.toLowerCase())

                // Date filtering
                let dateMatch = true
                if (dateRange.start || dateRange.end) {
                    const orderDate = new Date(order.order_date)
                    if (dateRange.start) {
                        dateMatch = dateMatch && orderDate >= new Date(dateRange.start)
                    }
                    if (dateRange.end) {
                        dateMatch = dateMatch && orderDate <= new Date(dateRange.end)
                    }
                }

                return orderStatusMatch && customerMatch && dateMatch
            })
    }, [allData, filterOrderStatus, filterTaskStatus, filterTaskUnit, filterCustomer, dateRange])

    const allTasks = useMemo(() => filteredData.flatMap((order) => order.tasks), [filteredData])

    // UI Handlers
    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
    }

    const clearAllFilters = () => {
        setFilterOrderStatus("all")
        setFilterTaskStatus("all")
        setFilterTaskUnit("all")
        setFilterCustomer("")
        setDateRange({ start: "", end: "" })
    }

    // Export Functions
    const exportToCsv = () => {
        try {
            let csvContent =
                "Order ID,Customer,Order Date,Order Status,Order Types,Task ID,Task Name,Task Status,Task Unit,Product,Color,Dependencies\n"

            filteredData.forEach((order) => {
                if (order.tasks.length > 0) {
                    order.tasks.forEach((task) => {
                        const dependencies = task.dependencies ? parseJsonSafe(task.dependencies, []) : []
                        const row = [
                            order.order_id,
                            `"${order.customer_name}"`,
                            new Date(order.order_date).toLocaleDateString(),
                            order.status || "Processing",
                            `"${order.types || ""}"`,
                            task.task_id || task.purchase_order_id,
                            `"${task.name}"`,
                            task.status,
                            task.task_unit || task.purchase_order_unit,
                            task.product || "",
                            task.color || "",
                            `"${dependencies.join(", ")}"`,
                        ].join(",")
                        csvContent += row + "\n"
                    })
                } else {
                    const row = [
                        order.order_id,
                        `"${order.customer_name}"`,
                        new Date(order.order_date).toLocaleDateString(),
                        order.status || "Processing",
                        `"${order.types || ""}"`,
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                    ].join(",")
                    csvContent += row + "\n"
                }
            })

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `orders_tasks_analysis_${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            if (toast?.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Export Complete",
                    detail: "Data exported to CSV successfully",
                    life: 3000,
                })
            }
        } catch (error) {
            console.error("CSV Export Error:", error)
            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Export Failed",
                    detail: "Failed to export CSV",
                    life: 3000,
                })
            }
        }
    }

    const exportToPdf = () => {
        try {
            const doc = new jsPDF()

            // Title
            doc.setFontSize(16)
            doc.text("Orders and Tasks Analysis Report", 14, 20)

            // Date
            doc.setFontSize(10)
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)

            // Summary stats
            doc.text(`Total Orders: ${filteredData.length}`, 14, 40)
            doc.text(`Total Tasks: ${allTasks.length}`, 14, 50)

            // Table data
            const tableData = []
            filteredData.forEach((order) => {
                if (order.tasks.length > 0) {
                    order.tasks.forEach((task) => {
                        tableData.push([
                            order.customer_name,
                            new Date(order.order_date).toLocaleDateString(),
                            order.status || "Processing",
                            task.name,
                            task.task_unit || task.purchase_order_unit,
                            task.status,
                        ])
                    })
                } else {
                    tableData.push([
                        order.customer_name,
                        new Date(order.order_date).toLocaleDateString(),
                        order.status || "Processing",
                        "No tasks",
                        "-",
                        "-",
                    ])
                }
            })

            autoTable(doc, {
                head: [["Customer", "Order Date", "Order Status", "Task Name", "Task Unit", "Task Status"]],
                body: tableData,
                startY: 60,
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                },
            })

            doc.save(`orders_tasks_analysis_${new Date().toISOString().slice(0, 10)}.pdf`)

            if (toast?.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Export Complete",
                    detail: "PDF exported successfully",
                    life: 3000,
                })
            }
        } catch (error) {
            console.error("PDF Export Error:", error)
            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Export Failed",
                    detail: "Failed to export PDF",
                    life: 3000,
                })
            }
        }
    }

    const handlePrint = () => {
        try {
            const printWindow = window.open("", "", "width=1200,height=800")
            const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orders and Tasks Analysis Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
            }
            .summary {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .summary-item {
              display: inline-block;
              margin-right: 30px;
              font-weight: bold;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #007bff; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f2f2f2; 
            }
            .badge {
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-success { background-color: #28a745; color: white; }
            .badge-warning { background-color: #ffc107; color: black; }
            .badge-danger { background-color: #dc3545; color: white; }
            .badge-secondary { background-color: #6c757d; color: white; }
            .badge-primary { background-color: #007bff; color: white; }
            .badge-info { background-color: #17a2b8; color: white; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Orders and Tasks Analysis Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          
          <div class="summary">
            <div class="summary-item">Total Orders: ${filteredData.length}</div>
            <div class="summary-item">Total Tasks: ${allTasks.length}</div>
            <div class="summary-item">Completed Tasks: ${allTasks.filter((t) => t.status === "COMPLETED").length}</div>
            <div class="summary-item">Active Tasks: ${allTasks.filter((t) => t.status === "IN PROGRESS").length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Order Status</th>
                <th>Task Name</th>
                <th>Task Unit</th>
                <th>Task Status</th>
                <th>Product/Color</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                    .map((order) => {
                        if (order.tasks.length > 0) {
                            return order.tasks
                                .map(
                                    (task) => `
                    <tr>
                      <td>${order.customer_name}</td>
                      <td>${new Date(order.order_date).toLocaleDateString()}</td>
                      <td><span class="badge badge-${getOrderStatusVariant(order.status || "Processing")}">${order.status || "Processing"}</span></td>
                      <td>${task.name}</td>
                            <td>${task.task_unit || task.purchase_order_unit}</td>
                      <td><span class="badge badge-${getTaskStatusVariant(task.status)}">${task.status}</span></td>
                      <td>${task.product || ""}${task.color ? " - " + task.color : ""}</td>
                    </tr>
                  `,
                                )
                                .join("")
                        } else {
                            return `
                    <tr>
                      <td>${order.customer_name}</td>
                      <td>${new Date(order.order_date).toLocaleDateString()}</td>
                      <td><span class="badge badge-${getOrderStatusVariant(order.status || "Processing")}">${order.status || "Processing"}</span></td>
                      <td colspan="4" style="text-align: center; color: #6c757d;">No tasks available</td>
                    </tr>
                  `
                        }
                    })
                    .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `

            printWindow.document.write(printContent)
            printWindow.document.close()

            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print()
                    printWindow.close()
                }, 250)
            }

            if (toast?.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Print Ready",
                    detail: "Print dialog opened successfully",
                    life: 3000,
                })
            }
        } catch (error) {
            console.error("Print Error:", error)
            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Print Failed",
                    detail: "Failed to open print dialog",
                    life: 3000,
                })
            }
        }
    }

    // Render Loading State
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
                    <h4 className="mt-3 text-muted">Loading comprehensive data...</h4>
                    <p className="text-muted">Please wait while we fetch all orders and tasks</p>
                </div>
            </div>
        )
    }

    // Render Error State
    if (error) {
        return (
            <Alert variant="danger" className="m-4">
                <Alert.Heading>Error Loading Data</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Alert>
        )
    }

    // Main Render
    return (
        <div className="p-3 p-md-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="h2 fw-bold mb-1 text-primary">
                        <FaChartBar className="me-2" />
                        Comprehensive Overview
                    </h1>
                    <p className="text-muted mb-0">Complete analysis of orders, tasks, and production status</p>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                    <Button
                        variant="outline-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className="d-flex align-items-center"
                    >
                        <FaFilter className="me-1" />
                        {showFilters ? "Hide" : "Show"} Filters
                    </Button>

                    <Dropdown>
                        <Dropdown.Toggle variant="primary" id="dropdown-export">
                            <FaFileCsv className="me-1" />
                            Export Analysis
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={exportToCsv}>
                                <FaFileCsv className="me-2" />
                                Export as CSV
                            </Dropdown.Item>
                            <Dropdown.Item onClick={exportToPdf}>
                                <FaFilePdf className="me-2" />
                                Export as PDF
                            </Dropdown.Item>
                            <Dropdown.Item onClick={handlePrint}>
                                <FaPrint className="me-2" />
                                Print Report
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            {/* KPI Cards */}
            <KpiCards orders={filteredData} tasks={allTasks} />

            {/* Filters */}
            {showFilters && (
                <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <FaFilter className="me-2 text-primary" />
                                <Card.Title as="h5" className="mb-0">
                                    Advanced Filters
                                </Card.Title>
                            </div>
                            <Button variant="outline-secondary" size="sm" onClick={clearAllFilters}>
                                Clear All
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">
                                        <FaUser className="me-1" />
                                        Customer Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search customer..."
                                        value={filterCustomer}
                                        onChange={(e) => setFilterCustomer(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Order Status</Form.Label>
                                    <Form.Select value={filterOrderStatus} onChange={(e) => setFilterOrderStatus(e.target.value)}>
                                        <option value="all">All Orders</option>
                                        {ORDER_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Task Status</Form.Label>
                                    <Form.Select value={filterTaskStatus} onChange={(e) => setFilterTaskStatus(e.target.value)}>
                                        <option value="all">All Tasks</option>
                                        {TASK_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Task Unit</Form.Label>
                                    <Form.Select value={filterTaskUnit} onChange={(e) => setFilterTaskUnit(e.target.value)}>
                                        <option value="all">All Units</option>
                                        {TASK_UNITS.map((u) => (
                                            <option key={u} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">
                                        <FaCalendarAlt className="me-1" />
                                        Start Date
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">
                                        <FaCalendarAlt className="me-1" />
                                        End Date
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab
                    eventKey="overview"
                    title={
                        <span>
                            <FaClipboardList className="me-1" />
                            Orders & Tasks ({filteredData.length})
                        </span>
                    }
                >
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-0">
                            <Table responsive hover className="align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: "40px" }}></th>
                                        <th>Customer</th>
                                        <th>Order Date</th>
                                        <th>Order Status</th>
                                        <th>Types</th>
                                        <th className="text-center">Tasks</th>
                                        <th className="text-center">Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((order) => {
                                        const completedTasks = order.tasks.filter((t) => t.status === "COMPLETED").length
                                        const totalTasks = order.tasks.length
                                        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                                        return (
                                            <React.Fragment key={order.order_id}>
                                                <tr
                                                    style={{
                                                        cursor: order.tasks.length > 0 ? "pointer" : "default",
                                                        borderLeft: `4px solid var(--bs-${getOrderStatusVariant(order.status || "Processing")})`,
                                                    }}
                                                    onClick={() => order.tasks.length > 0 && toggleOrderExpansion(order.order_id)}
                                                >
                                                    <td>
                                                        {order.tasks.length > 0 &&
                                                            (expandedOrders[order.order_id] ? (
                                                                <FaChevronDown size={14} className="text-primary" />
                                                            ) : (
                                                                <FaChevronRight size={14} className="text-muted" />
                                                            ))}
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{order.customer_name}</div>
                                                        <small className="text-muted">ID: {order.order_id}</small>
                                                    </td>
                                                    <td>
                                                        <FaCalendarAlt className="me-1 text-muted" />
                                                        {new Date(order.order_date).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <Badge bg={getOrderStatusVariant(order.status || "Processing")}>
                                                            {order.status || "Processing"}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <span className="text-muted">{order.types || "N/A"}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg="light" text="dark" className="fs-6">
                                                            {totalTasks}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        {totalTasks > 0 ? (
                                                            <div style={{ minWidth: "100px" }}>
                                                                <div className="d-flex justify-content-between mb-1">
                                                                    <small>
                                                                        {completedTasks}/{totalTasks}
                                                                    </small>
                                                                    <small>{progressPercent}%</small>
                                                                </div>
                                                                <ProgressBar
                                                                    now={progressPercent}
                                                                    variant={
                                                                        progressPercent === 100 ? "success" : progressPercent > 50 ? "warning" : "danger"
                                                                    }
                                                                    style={{ height: "6px" }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">No tasks</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {expandedOrders[order.order_id] && (
                                                    <tr>
                                                        <td colSpan="7" className="p-0">
                                                            <div className="p-3 bg-light border-top">
                                                                {order.tasks.length > 0 ? (
                                                                    <Table bordered size="sm" className="bg-white mb-0">
                                                                        <thead className="table-secondary">
                                                                            <tr>
                                                                                <th>Task Name</th>
                                                                                <th>Unit</th>
                                                                                <th>Status</th>
                                                                                <th>Product / Color</th>
                                                                                <th>Charts</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                                                                                    {order.tasks.map((task) => (
                                                                                                                                        <tr key={task.task_id || task.purchase_order_id}>
                                                                                                                                            <td>
                                                                                                                                                <div className="fw-medium">{task.name}</div>
                                                                                                                                                <small className="text-muted">ID: {task.task_id || task.purchase_order_id}</small>
                                                                                                                                            </td>
                                                                                                                                            <td>
                                                                                                                                                <Badge bg={getTaskUnitVariant(task.task_unit || task.purchase_order_unit)}>
                                                                                                                                                    {getTaskUnitIcon(task.task_unit || task.purchase_order_unit)}
                                                                                                                                                    {task.task_unit || task.purchase_order_unit}
                                                                                                                                                </Badge>
                                                                                                                                            </td>
                                                                                    <td>
                                                                                        <Badge bg={getTaskStatusVariant(task.status)}>
                                                                                            {getStatusIcon(task.status)}
                                                                                            {task.status}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div>
                                                                                            {task.product && <span className="fw-medium">{task.product}</span>}
                                                                                            {task.color && (
                                                                                                <Badge bg="light" text="dark" className="ms-1">
                                                                                                    {task.color}
                                                                                                </Badge>
                                                                                            )}
                                                                                            {!task.product && !task.color && (
                                                                                                <span className="text-muted">Not specified</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="d-flex gap-1">
                                                                                            {task.incoming_chart && (
                                                                                                <Badge bg="primary" title="Has incoming chart">
                                                                                                    📥 In
                                                                                                </Badge>
                                                                                            )}
                                                                                            {task.outgoing_chart && (
                                                                                                <Badge bg="success" title="Has outgoing chart">
                                                                                                    📤 Out
                                                                                                </Badge>
                                                                                            )}
                                                                                            {!task.incoming_chart && !task.outgoing_chart && (
                                                                                                <Badge bg="light" text="dark" title="No charts available">
                                                                                                    📊 None
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                ) : (
                                                                    <div className="text-center text-muted p-3">
                                                                        No tasks match the current filters for this order.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}

                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center p-5">
                                                <div className="text-muted">
                                                    <FaSearch size={48} className="mb-3 opacity-50" />
                                                    <h5>No orders match the current filters</h5>
                                                    <p>Try adjusting your filter criteria or clearing all filters.</p>
                                                    <Button variant="outline-primary" onClick={clearAllFilters}>
                                                        Clear All Filters
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab
                    eventKey="analysis"
                    title={
                        <span>
                            <FaChartBar className="me-1" />
                            Production Analysis
                        </span>
                    }
                >
                    <TaskUnitVisualization tasks={allTasks} />
                </Tab>
            </Tabs>
        </div>
    )
}

export default ConsolidatedOverview
