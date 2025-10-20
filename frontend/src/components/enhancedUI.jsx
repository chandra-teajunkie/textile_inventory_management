"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
    Card,
    Button,
    Row,
    Col,
    Badge,
    Table,
    Form,
    Dropdown,
    Tabs,
    Tab,
    ProgressBar,
    Modal,
    ListGroup,
} from "react-bootstrap"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import html2canvas from "html2canvas"
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    Line,
    RadialBarChart,
    RadialBar,
    ComposedChart,
    Area,
} from "recharts"
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
    FaChartPie,
    FaChartLine,
    FaExclamationCircle,
    FaFire,
    FaCalendarTimes,
    FaListAlt,
    FaEye,
    FaTimes,
} from "react-icons/fa"
import { GiSewingMachine, GiHeavyCollar } from "react-icons/gi"
import { TbHttpGet } from "react-icons/tb"
import { parseJsonSafe } from "../utils/jsonUtils"
import { OverlayTrigger, Popover } from "react-bootstrap"

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
const TASK_STATUSES = ["NOT STARTED", "IN PROGRESS", "COMPLETED", "BLOCKED"]

// Chart colors for consistent theming
const CHART_COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C7C",
    "#8DD1E1",
    "#D084D0",
    "#87D068",
    "#FFB347",
]

const UNIT_COLORS = {
    PROCUREMENT: "#0088FE",
    COLLAR: "#00C49F",
    CUTTING: "#FF8042",
    PRINTING: "#8884D8",
    EMBROIDERY: "#FFBB28",
    STITCHING: "#82CA9D",
    PACKAGING: "#FFC658",
    UNASSIGNED: "#6c757d", // Changed from #D3D3D3 to a darker gray
}

const STATUS_COLORS = {
    "NOT STARTED": "#6c757d",
    "IN PROGRESS": "#ffc107",
    COMPLETED: "#28a745",
    BLOCKED: "#dc3545",
}

// Date range presets
const DATE_PRESETS = {
    last7: { label: "Last 7 days", days: 7 },
    last30: { label: "Last 30 days", days: 30 },
    last90: { label: "Last 90 days", days: 90 },
    thisMonth: { label: "This month", days: null },
    lastMonth: { label: "Last month", days: null },
}

// Helper function to get date range
const getDateRange = (preset) => {
    const today = new Date()
    const start = new Date()

    switch (preset) {
        case "last7":
        case "last30":
        case "last90":
            start.setDate(today.getDate() - DATE_PRESETS[preset].days)
            return { start, end: today }
        case "thisMonth":
            start.setDate(1)
            return { start, end: today }
        case "lastMonth":
            start.setMonth(today.getMonth() - 1)
            start.setDate(1)
            const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
            return { start, end: lastDayOfLastMonth }
        default:
            start.setDate(today.getDate() - 30)
            return { start, end: today }
    }
}

// Helper function to check if date is overdue
const isOverdue = (dueDate) => {
    if (!dueDate) return false
    const today = new Date()
    const due = new Date(dueDate)
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return due < today
}

// Helper function to get days until due
const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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

const CustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, unit }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5

    // Add safety checks for NaN values
    if (isNaN(cx) || isNaN(cy) || isNaN(midAngle) || isNaN(radius) || isNaN(percent)) {
        return null
    }

    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    // Additional safety check for calculated positions
    if (isNaN(x) || isNaN(y)) {
        return null
    }

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize="12"
            fontWeight="bold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

// --- Quick View Modal Component ---
const QuickViewModal = ({ show, onHide, title, items, type }) => {
    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaEye className="me-2" />
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {items && items.length > 0 ? (
                    <ListGroup>
                        {items.map((item, index) => (
                            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-bold">{item.name || item.customer_name}</div>
                                    <small className="text-muted">
                                        {type === "task" ? `Unit: ${item.task_unit}` : `Order ID: ${item.order_id}`}
                                    </small>
                                    {item.product && <small className="text-muted"> | Product: {item.product}</small>}
                                    {item.color && <small className="text-muted"> | Color: {item.color}</small>}
                                </div>
                                <div>
                                    <Badge bg={type === "task" ? getTaskStatusVariant(item.status) : "primary"}>
                                        {item.status || "Active"}
                                    </Badge>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <div className="text-center text-muted p-4">
                        <FaSearch size={48} className="mb-3 opacity-50" />
                        <p>No items found</p>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    <FaTimes className="me-1" />
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

// --- Enhanced KPI Cards Component ---
const KpiCards = ({ orders, tasks }) => {
    const taskStatusCounts = useMemo(() => {
        return tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1
            return acc
        }, {})
    }, [tasks])

    const completionRate = useMemo(() => {
        if (tasks.length === 0) return 0
        return Math.round(((taskStatusCounts.COMPLETED || 0) / tasks.length) * 100)
    }, [tasks.length, taskStatusCounts.COMPLETED])

    const urgentItems = useMemo(() => {
        const overdueOrders = orders.filter((order) => isOverdue(order.due_date)).length
        const blockedTasks = taskStatusCounts.BLOCKED || 0
        return overdueOrders + blockedTasks
    }, [orders, taskStatusCounts.BLOCKED])

    const overdueOrders = useMemo(() => {
        return orders.filter((order) => isOverdue(order.due_date)).length
    }, [orders])

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
                            <div className="small text-muted">
                                <FaCalendarAlt className="me-1" />
                                {overdueOrders} overdue
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
                                {taskStatusCounts["IN PROGRESS"] || 0} active
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
                                <FaFire className="me-1" />
                                Urgent Items
                            </div>
                            <div className="h3 fw-bold text-danger mb-0">{urgentItems}</div>
                            <div className="small text-danger">
                                <FaExclamationTriangle className="me-1" />
                                {taskStatusCounts.BLOCKED || 0} blocked tasks
                            </div>
                        </div>
                        <div className="text-danger opacity-25">
                            <FaFire size={40} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
}

// --- Chart Components with Interactions ---
const TaskStatusPieChart = ({ tasks, onSegmentClick }) => {
    const data = useMemo(() => {
        const statusCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1
            return acc
        }, {})

        return Object.entries(statusCounts).map(([status, count]) => ({
            name: status,
            value: count,
            color: STATUS_COLORS[status] || "#8884d8",
            tasks: tasks.filter((t) => t.status === status),
        }))
    }, [tasks])

    const handleClick = (data) => {
        if (onSegmentClick) {
            onSegmentClick(data.tasks, `Tasks with status: ${data.name}`)
        }
    }

    return (
        <Card className="shadow-sm border-0 h-100" id="task-status-pie-chart">
            <Card.Header className="bg-light">
                <Card.Title as="h6" className="mb-0">
                    <FaChartPie className="me-2" />
                    Task Status Distribution
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            onClick={handleClick}
                            style={{ cursor: "pointer" }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value, name, props) => [`${value} tasks`, name, `Click to view details`]} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card.Body>
        </Card>
    )
}

const TaskUnitBarChart = ({ tasks, onBarClick }) => {
    const data = useMemo(() => {
        const unitStats = {}
        TASK_UNITS.forEach((unit) => {
            const unitTasks = tasks.filter((task) => task.task_unit === unit || task.purchase_order_unit === unit)
            const completed = unitTasks.filter((t) => t.status === "COMPLETED").length
            const inProgress = unitTasks.filter((t) => t.status === "IN PROGRESS").length
            const blocked = unitTasks.filter((t) => t.status === "BLOCKED").length
            const notStarted = unitTasks.filter((t) => t.status === "NOT STARTED").length

            unitStats[unit] = {
                unit,
                total: unitTasks.length,
                completed,
                inProgress,
                blocked,
                notStarted,
                tasks: unitTasks,
            }
        })
        return Object.values(unitStats).filter((stat) => stat.total > 0)
    }, [tasks])

    const handleClick = (data) => {
        if (onBarClick && data.activePayload) {
            const unitData = data.activePayload[0].payload
            onBarClick(unitData.tasks, `Tasks in ${unitData.unit} unit`)
        }
    }

    return (
        <Card className="shadow-sm border-0 h-100" id="task-unit-bar-chart">
            <Card.Header className="bg-light">
                <Card.Title as="h6" className="mb-0">
                    <FaChartBar className="me-2" />
                    Tasks by Production Unit
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleClick}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="unit" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <RechartsTooltip
                            formatter={(value, name) => [`${value} tasks`, name]}
                            labelFormatter={(label) => `Unit: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="completed" stackId="a" fill="#28a745" name="Completed" />
                        <Bar dataKey="inProgress" stackId="a" fill="#ffc107" name="In Progress" />
                        <Bar dataKey="blocked" stackId="a" fill="#dc3545" name="Blocked" />
                        <Bar dataKey="notStarted" stackId="a" fill="#6c757d" name="Not Started" />
                    </BarChart>
                </ResponsiveContainer>
            </Card.Body>
        </Card>
    )
}

const ProductionProgressChart = ({ tasks, onSegmentClick }) => {
    const data = useMemo(() => {
        return TASK_UNITS.map((unit) => {
            const unitTasks = tasks.filter((task) => task.task_unit === unit || task.purchase_order_unit === unit)
            const completed = unitTasks.filter((t) => t.status === "COMPLETED").length
            const total = unitTasks.length
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

            return {
                unit: unit.replace("_", " "),
                completionRate,
                total,
                completed,
                color: UNIT_COLORS[unit] || "#8884d8",
                tasks: unitTasks,
            }
        }).filter((item) => item.total > 0)
    }, [tasks])

    const handleClick = (data) => {
        if (onSegmentClick && data.activePayload) {
            const unitData = data.activePayload[0].payload
            onSegmentClick(unitData.tasks, `Tasks in ${unitData.unit} unit`)
        }
    }

    const TaskTimelineChart = ({ orders, dateRange, onDateRangeChange }) => {
        const [timelineRange, setTimelineRange] = useState("last30")

        const data = useMemo(() => {
            const { start, end } = getDateRange(timelineRange)
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

            const timelineData = Array.from({ length: days }, (_, i) => {
                const date = new Date(start)
                date.setDate(date.getDate() + i)
                return {
                    date: date.toISOString().split("T")[0],
                    displayDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    orders: 0,
                    overdue: 0,
                    ordersList: [],
                }
            })

            orders.forEach((order) => {
                const orderDate = new Date(order.order_date).toISOString().split("T")[0]
                const dayData = timelineData.find((d) => d.date === orderDate)
                if (dayData) {
                    dayData.orders += 1
                    dayData.ordersList.push(order)
                    if (isOverdue(order.due_date)) {
                        dayData.overdue += 1
                    }
                }
            })

            return timelineData
        }, [orders, timelineRange])

        const handlePresetChange = (preset) => {
            setTimelineRange(preset)
            if (onDateRangeChange) {
                const range = getDateRange(preset)
                onDateRangeChange(range)
            }
        }

        return (
            <div>
                <Card className="shadow-sm border-0 mb-3">
                    <Card.Header className="bg-light">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center">
                                <FaCalendarAlt className="me-2 text-primary" />
                                <Card.Title as="h5" className="mb-0">
                                    Orders Timeline Analysis
                                </Card.Title>
                            </div>
                            <div className="btn-group">
                                {Object.entries(DATE_PRESETS).map(([key, preset]) => (
                                    <Button
                                        key={key}
                                        variant={timelineRange === key ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => handlePresetChange(key)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </Card.Header>
                </Card>

                <Card className="shadow-sm border-0 h-100" id="timeline-chart">
                    <Card.Body>
                        <ResponsiveContainer width="100%" height={400}>
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayDate" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <RechartsTooltip
                                    labelFormatter={(value, payload) => {
                                        if (payload && payload[0]) {
                                            const data = payload[0].payload
                                            return `${value} - ${data.orders} orders${data.overdue > 0 ? `, ${data.overdue} overdue` : ""}`
                                        }
                                        return value
                                    }}
                                    formatter={(value, name) => [value, name === "orders" ? "Total Orders" : "Overdue Orders"]}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="orders" fill="#0088FE" stroke="#0088FE" name="Orders" />
                                <Line type="monotone" dataKey="overdue" stroke="#FF8042" strokeWidth={3} name="Overdue" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Card.Body>
                </Card>
            </div>
        )
    }

    const CustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, unit }) => {
        const RADIAN = Math.PI / 180
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5

        // Add safety checks for NaN values
        if (isNaN(cx) || isNaN(cy) || isNaN(midAngle) || isNaN(radius) || isNaN(percent)) {
            return null
        }

        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                fontSize="12"
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        )
    }

    return (
        <Card className="shadow-sm border-0 h-100" id="production-progress-chart">
            <Card.Header className="bg-light">
                <Card.Title as="h6" className="mb-0">
                    <FaChartLine className="me-2" />
                    Production Unit Progress
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={data} onClick={handleClick}>
                        <RadialBar
                            minAngle={15}
                            label={<CustomizedLabel />}
                            background
                            clockWise
                            dataKey="completionRate"
                            style={{ cursor: "pointer" }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </RadialBar>
                        <Legend
                            iconSize={10}
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            formatter={(value, entry) => `${entry.payload.unit} (${entry.payload.total} tasks)`}
                        />
                        <RechartsTooltip
                            formatter={(value, name, props) => [
                                `${value}% complete`,
                                `${props.payload.completed}/${props.payload.total} tasks`,
                                "Click to view details",
                            ]}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
            </Card.Body>
        </Card>
    )
}

const TaskTimelineChart = ({ orders, dateRange, onDateRangeChange }) => {
    const [timelineRange, setTimelineRange] = useState("last30")
    const [expandedOrdersTimeline, setExpandedOrdersTimeline] = useState({})

    const data = useMemo(() => {
        const { start, end } = getDateRange(timelineRange)
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

        // Build initial timeline within the preset range
        const timelineMap = new Map()

        for (let i = 0; i < days; i++) {
            const dateObj = new Date(start)
            dateObj.setDate(dateObj.getDate() + i)
            const key = dateObj.toISOString().split("T")[0]
            timelineMap.set(key, {
                date: key,
                displayDate: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                orders: 0,
                overdue: 0,
                ordersList: [],
            })
        }

        // Helper to normalize order date (fallback to due_date)
        const normalizeOrderDate = (order) => {
            const tryDate = order.order_date || order.due_date
            if (!tryDate) return null
            const d = new Date(tryDate)
            if (isNaN(d)) return null
            return d.toISOString().split("T")[0]
        }

        // Ensure all orders are represented — if an order's date is outside the preset range, add it as its own day
        orders.forEach((order) => {
            const orderDateKey = normalizeOrderDate(order)
            if (!orderDateKey) return

            if (!timelineMap.has(orderDateKey)) {
                // create a day entry for this date
                const d = new Date(orderDateKey)
                timelineMap.set(orderDateKey, {
                    date: orderDateKey,
                    displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    orders: 0,
                    overdue: 0,
                    ordersList: [],
                })
            }

            const dayData = timelineMap.get(orderDateKey)
            dayData.orders += 1
            dayData.ordersList.push(order)
            // Use order.isOverdue (already considers completed tasks)
            if (order.isOverdue) {
                dayData.overdue += 1
            }
        })

        // Convert map to sorted array by date
        const timelineArray = Array.from(timelineMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
        return timelineArray
    }, [orders, timelineRange])

    const handlePresetChange = (preset) => {
        setTimelineRange(preset)
        if (onDateRangeChange) {
            const range = getDateRange(preset)
            onDateRangeChange(range)
        }
    }
    return (
        <div>
            <Card className="shadow-sm border-0 mb-3">
                <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-primary" />
                            <Card.Title as="h5" className="mb-0">
                                Orders Timeline Analysis
                            </Card.Title>
                        </div>
                        <div className="d-flex align-items-center">
                            <div className="me-3 small text-muted d-flex align-items-center gap-2">
                                <span
                                    className="d-inline-block"
                                    style={{ width: 12, height: 12, background: "#0088FE", borderRadius: 2 }}
                                ></span>
                                <span>Orders</span>
                            </div>
                            <div className="me-3 small text-muted d-flex align-items-center gap-2">
                                <span
                                    className="d-inline-block"
                                    style={{ width: 12, height: 12, background: "#FF8042", borderRadius: 2 }}
                                ></span>
                                <span>Overdue</span>
                            </div>
                            <div className="me-3 small text-muted d-flex align-items-center gap-2">
                                <Badge bg="success" style={{ padding: "4px 6px" }}></Badge>
                                <span>Completed</span>
                            </div>
                            <div className="me-3 small text-muted d-flex align-items-center gap-2">
                                <Badge bg="warning" style={{ padding: "4px 6px" }}></Badge>
                                <span>In Progress</span>
                            </div>
                        </div>

                        <div className="btn-group">
                            {Object.entries(DATE_PRESETS).map(([key, preset]) => (
                                <Button
                                    key={key}
                                    variant={timelineRange === key ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={() => handlePresetChange(key)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </Card.Header>
            </Card>

            <Card className="shadow-sm border-0 h-100 mb-3" id="timeline-chart">
                <Card.Body>
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="displayDate" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <RechartsTooltip
                                labelFormatter={(value, payload) => {
                                    if (payload && payload[0]) {
                                        const d = payload[0].payload
                                        return `${value} — ${d.orders} orders${d.overdue > 0 ? `, ${d.overdue} overdue` : ""}`
                                    }
                                    return value
                                }}
                                formatter={(value, name) => [value, name === "orders" ? "Total Orders" : "Overdue Orders"]}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="orders" fill="#0088FE" stroke="#0088FE" name="Orders" />
                            <Line type="monotone" dataKey="overdue" stroke="#FF8042" strokeWidth={3} name="Overdue" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Card.Body>
            </Card>

            {/* Orders detail panel showing order list with progress and tasks */}
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <FaListAlt className="me-2 text-primary" />
                            <Card.Title as="h6" className="mb-0">
                                Orders Detail & Task Progress
                            </Card.Title>
                        </div>
                        <small className="text-muted">Showing {orders.length} orders</small>
                    </div>
                </Card.Header>
                <Card.Body>
                    {orders && orders.length > 0 ? (
                        <div className="list-group list-group-flush">
                            {orders.map((order) => {
                                const tasks = order.tasks || []
                                const completed = tasks.filter((t) => t.status === "COMPLETED").length
                                const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
                                const overdue = isOverdue(order.due_date)
                                const keyId = order.order_id || order.id || JSON.stringify(order)

                                return (
                                    <div key={keyId} className="list-group-item py-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div className="fw-bold">
                                                    {order.customer_name || order.customer || order.name || order.order_id}
                                                </div>
                                                <div className="small text-muted">
                                                    Order: {order.order_id || order.id} • {order.product || ""}
                                                </div>
                                                <div className="small text-muted">Due: {order.due_date || order.dueDate || "—"}</div>
                                            </div>
                                            <div className="text-end" style={{ minWidth: 160 }}>
                                                {overdue && (
                                                    <Badge bg="danger" className="mb-1">
                                                        Overdue
                                                    </Badge>
                                                )}
                                                <div className="small text-muted">Tasks: {tasks.length}</div>
                                                <div style={{ width: 160 }}>
                                                    <ProgressBar
                                                        now={progress}
                                                        label={`${progress}%`}
                                                        variant={progress === 100 ? "success" : progress > 50 ? "warning" : "primary"}
                                                        style={{ height: "10px" }}
                                                    />
                                                </div>
                                                <div className="mt-2">
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => setExpandedOrdersTimeline((p) => ({ ...p, [keyId]: !p[keyId] }))}
                                                    >
                                                        {expandedOrdersTimeline[keyId] ? "Hide tasks" : "Show tasks"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedOrdersTimeline[keyId] && (
                                            <div className="mt-3">
                                                {tasks.length > 0 ? (
                                                    <div className="row g-2">
                                                        {tasks.map((t, idx) => (
                                                            <div key={idx} className="col-12 col-md-6 mb-2">
                                                                <Card className="p-2">
                                                                    <div className="d-flex justify-content-between">
                                                                        <div>
                                                                            <div className="fw-bold small">{t.name || t.task_name || `Task ${idx + 1}`}</div>
                                                                            <div className="small text-muted">
                                                                                Unit: {t.task_unit || t.purchase_order_unit || t.unit || "—"}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <Badge bg={getTaskStatusVariant(t.status)} className="mb-1">
                                                                                {t.status || "N/A"}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <small className="text-muted">Due: {t.due_date || t.dueDate || "—"}</small>
                                                                    </div>
                                                                </Card>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-muted small">No tasks for this order</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted py-3">No orders in the selected range</div>
                    )}
                </Card.Body>
            </Card>
        </div>
    )
}

// --- Enhanced Task Unit Visualization Component ---
const TaskUnitVisualization = ({ tasks }) => {
    const [chartView, setChartView] = useState("cards")
    const [quickViewModal, setQuickViewModal] = useState({
        show: false,
        title: "",
        items: [],
        type: "task",
    })

    const handleChartClick = (items, title, type = "task") => {
        setQuickViewModal({
            show: true,
            title,
            items,
            type,
        })
    }

    const unitStats = useMemo(() => {
        const stats = {}
        TASK_UNITS.forEach((unit) => {
            const unitTasks = tasks.filter((task) => task.task_unit === unit || task.purchase_order_unit === unit)
            const completed = unitTasks.filter((t) => t.status === "COMPLETED").length
            const inProgress = unitTasks.filter((t) => t.status === "IN PROGRESS").length
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
        <div>
            {/* Chart View Selector */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <FaChartBar className="me-2 text-primary" />
                            <Card.Title as="h5" className="mb-0">
                                Production Analysis Dashboard
                            </Card.Title>
                        </div>
                        <div className="btn-group">
                            <Button
                                variant={chartView === "cards" ? "primary" : "outline-primary"}
                                size="sm"
                                onClick={() => setChartView("cards")}
                            >
                                <FaClipboardList className="me-1" />
                                Cards
                            </Button>
                            <Button
                                variant={chartView === "charts" ? "primary" : "outline-primary"}
                                size="sm"
                                onClick={() => setChartView("charts")}
                            >
                                <FaChartPie className="me-1" />
                                Charts
                            </Button>
                        </div>
                    </div>
                </Card.Header>
            </Card>

            {chartView === "cards" ? (
                // Original Cards View
                <Card className="shadow-sm border-0">
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
                                                            stats.completionRate === 100
                                                                ? "success"
                                                                : stats.completionRate > 50
                                                                    ? "warning"
                                                                    : "danger"
                                                        }
                                                        style={{ height: "8px" }}
                                                    />
                                                </div>

                                                {stats.total > 0 && (
                                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                                        {stats.completed > 0 && (
                                                            <Badge
                                                                bg="success"
                                                                className="small"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() =>
                                                                    handleChartClick(
                                                                        stats.tasks.filter((t) => t.status === "COMPLETED"),
                                                                        `Completed tasks in ${unit}`,
                                                                    )
                                                                }
                                                            >
                                                                {stats.completed} Done
                                                            </Badge>
                                                        )}
                                                        {stats.inProgress > 0 && (
                                                            <Badge
                                                                bg="warning"
                                                                className="small"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() =>
                                                                    handleChartClick(
                                                                        stats.tasks.filter((t) => t.status === "IN PROGRESS"),
                                                                        `In Progress tasks in ${unit}`,
                                                                    )
                                                                }
                                                            >
                                                                {stats.inProgress} Active
                                                            </Badge>
                                                        )}
                                                        {stats.blocked > 0 && (
                                                            <Badge
                                                                bg="danger"
                                                                className="small"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() =>
                                                                    handleChartClick(
                                                                        stats.tasks.filter((t) => t.status === "BLOCKED"),
                                                                        `Blocked tasks in ${unit}`,
                                                                    )
                                                                }
                                                            >
                                                                {stats.blocked} Blocked
                                                            </Badge>
                                                        )}
                                                        {stats.notStarted > 0 && (
                                                            <Badge
                                                                bg="secondary"
                                                                className="small"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() =>
                                                                    handleChartClick(
                                                                        stats.tasks.filter((t) => t.status === "NOT STARTED"),
                                                                        `Not Started tasks in ${unit}`,
                                                                    )
                                                                }
                                                            >
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
            ) : (
                // Charts View
                <Row className="g-4">
                    <Col lg={6}>
                        <TaskStatusPieChart tasks={tasks} onSegmentClick={handleChartClick} />
                    </Col>
                    <Col lg={6}>
                        <ProductionProgressChart tasks={tasks} onSegmentClick={handleChartClick} />
                    </Col>
                    <Col lg={12}>
                        <TaskUnitBarChart tasks={tasks} onBarClick={handleChartClick} />
                    </Col>
                </Row>
            )}

            {/* Quick View Modal */}
            <QuickViewModal
                show={quickViewModal.show}
                onHide={() => setQuickViewModal({ ...quickViewModal, show: false })}
                title={quickViewModal.title}
                items={quickViewModal.items}
                type={quickViewModal.type}
            />
        </div>
    )
}

// --- Main Consolidated View Component ---
const EnhancedConsolidatedOverview = ({ toast }) => {
    // Refs for chart elements
    const chartRefs = useRef({})

    // State Management
    const [allData, setAllData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filtering state (commented out order status)
    const [filterTaskStatus, setFilterTaskStatus] = useState("all")
    const [filterTaskUnit, setFilterTaskUnit] = useState("all")
    const [filterCustomer, setFilterCustomer] = useState("")
    const [dateRange, setDateRange] = useState({ start: "", end: "" })
    const [showOverdueOnly, setShowOverdueOnly] = useState(false)

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
                // Normalize order fields to ensure consistent keys across UI
                orders = (orders || []).map((o) => ({
                    ...o,
                    order_id: o.order_id || o.purchase_order_id || o.id,
                    purchase_unit_notes: o.purchase_unit_notes || o.task_unit_notes || "{}",
                    order_date: o.order_date || o.purchase_order_date || o.start_date || null,
                    due_date: o.due_date || o.purchase_order_due_date || o.due_date || null,
                }))
                orders = orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))

                // Fetch tasks for each order
                const tasksPromises = orders.map((order) =>
                    fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${order.order_id || order.purchase_order_id || order.id}`)
                        .then((res) => (res.ok ? res.json() : []))
                        .catch(() => []),
                )

                const tasksResults = await Promise.all(tasksPromises)

                // Combine orders and tasks
                const combinedData = orders.map((order, index) => {
                    const tasks = tasksResults[index] || []
                    const allTasksCompleted = tasks.length > 0 && tasks.every((t) => t.status === "COMPLETED")
                    const overdueByDate = isOverdue(order.due_date)

                    return {
                        ...order,
                        tasks,
                        // If all tasks are completed, consider the order completed regardless of due date
                        isOverdue: !allTasksCompleted && overdueByDate,
                        daysUntilDue: allTasksCompleted ? null : getDaysUntilDue(order.due_date),
                        isUrgent: (!allTasksCompleted && overdueByDate) || tasks.some((task) => task.status === "BLOCKED"),
                    }
                })

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
                    const taskUnitMatch = filterTaskUnit === "all" || task.task_unit === filterTaskUnit || task.purchase_order_unit === filterTaskUnit
                    return taskStatusMatch && taskUnitMatch
                })

                return { ...order, tasks }
            })
            .filter((order) => {
                // Filter orders
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

                // Overdue filter
                const overdueMatch = !showOverdueOnly || order.isOverdue

                return customerMatch && dateMatch && overdueMatch
            })
    }, [allData, filterTaskStatus, filterTaskUnit, filterCustomer, dateRange, showOverdueOnly])

    const allTasks = useMemo(() => filteredData.flatMap((order) => order.tasks), [filteredData])

    // New helper function to check if all tasks in an order are completed
    const areAllTasksCompleted = (tasks) => {
        if (!tasks || tasks.length === 0) return false
        return tasks.every((task) => task.status === "COMPLETED")
    }

    // UI Handlers
    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
    }

    const clearAllFilters = () => {
        setFilterTaskStatus("all")
        setFilterTaskUnit("all")
        setFilterCustomer("")
        setDateRange({ start: "", end: "" })
        setShowOverdueOnly(false)
    }

    // Enhanced Export Functions with Charts
    const captureCharts = async () => {
        const charts = {}
        const chartElements = [
            { id: "task-status-pie-chart", name: "Task Status Distribution" },
            { id: "task-unit-bar-chart", name: "Tasks by Production Unit" },
            { id: "production-progress-chart", name: "Production Unit Progress" },
            { id: "timeline-chart", name: "Timeline Analysis" },
        ]

        for (const chart of chartElements) {
            const element = document.getElementById(chart.id)
            if (element) {
                try {
                    // Wait a bit for charts to fully render
                    await new Promise((resolve) => setTimeout(resolve, 500))

                    const canvas = await html2canvas(element, {
                        backgroundColor: "#ffffff",
                        scale: 1.5,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        foreignObjectRendering: true,
                        imageTimeout: 15000,
                        removeContainer: true,
                    })
                    charts[chart.id] = {
                        dataUrl: canvas.toDataURL("image/png", 0.95),
                        name: chart.name,
                    }
                } catch (error) {
                    console.warn(`Failed to capture chart ${chart.id}:`, error)
                    // Create a placeholder for failed charts
                    charts[chart.id] = {
                        dataUrl: null,
                        name: chart.name,
                        error: true,
                    }
                }
            }
        }
        return charts
    }

    const exportToCsv = () => {
        try {
            let csvContent =
                "Order ID,Customer,Order Date,Due Date,Days Until Due,Is Overdue,Is Urgent,Order Types,Task ID,Task Name,Task Status,Task Unit,Product,Color,Dependencies\n"

            filteredData.forEach((order) => {
                if (order.tasks.length > 0) {
                    order.tasks.forEach((task) => {
                        const dependencies = task.dependencies ? parseJsonSafe(task.dependencies, []) : []
                        const row = [
                            order.order_id,
                            `"${order.customer_name}"`,
                            new Date(order.order_date).toLocaleDateString(),
                            order.due_date ? new Date(order.due_date).toLocaleDateString() : "N/A",
                            order.daysUntilDue || "N/A",
                            order.isOverdue ? "Yes" : "No",
                            order.isUrgent ? "Yes" : "No",
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
                        order.due_date ? new Date(order.due_date).toLocaleDateString() : "N/A",
                        order.daysUntilDue || "N/A",
                        order.isOverdue ? "Yes" : "No",
                        order.isUrgent ? "Yes" : "No",
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

    const exportToPdf = async () => {
        try {
            if (toast?.current) {
                toast.current.show({
                    severity: "info",
                    summary: "Generating PDF",
                    detail: "Capturing charts and generating PDF...",
                    life: 5000,
                })
            }

            const charts = await captureCharts()
            const validCharts = Object.entries(charts).filter(([_, chart]) => chart.dataUrl && !chart.error)

            const doc = new jsPDF("l", "mm", "a4") // Landscape orientation
            let yPosition = 20

            doc.setFontSize(18)
            doc.setFont(undefined, "bold")
            doc.text("SIDHU Textiles", 14, yPosition)
            yPosition += 8

            doc.setFontSize(9)
            doc.setFont(undefined, "normal")
            doc.text("MFRS: EXPORTERS OF HIGH CLASS HOSIERY & SPORTS WEARS", 14, yPosition)
            yPosition += 6
            doc.text("17/1, Near Sivan Theatre (North), I st Street", 14, yPosition)
            yPosition += 5
            doc.text("Kumaranandhapuram, TIRUPUR - 641 602.", 14, yPosition)
            yPosition += 5
            doc.text("Phone: 0421 - 2477863, 94430 31108", 14, yPosition)
            yPosition += 5
            doc.text("GSTIN: 33ACWPM6268J1ZV", 14, yPosition)
            yPosition += 10

            // Add Ref and Date fields
            const currentDate = new Date().toLocaleDateString()
            doc.text(`Ref: ORD-${new Date().getTime()}`, 14, yPosition)
            doc.text(`Date: ${currentDate}`, 220, yPosition)
            yPosition += 10

            // Add separator line
            doc.setLineWidth(0.5)
            doc.line(14, yPosition, 283, yPosition)
            yPosition += 10

            doc.setFontSize(14)
            doc.setFont(undefined, "bold")
            doc.text("Orders and Tasks Analysis Report", 14, yPosition)
            yPosition += 10

            doc.setFontSize(10)
            doc.setFont(undefined, "bold")
            doc.text("Summary:", 14, yPosition)
            yPosition += 8

            doc.setFont(undefined, "normal")
            const summaryCol1X = 20
            const summaryCol2X = 100
            const summaryCol3X = 180

            doc.text(`Total Orders: ${filteredData.length}`, summaryCol1X, yPosition)
            doc.text(`Total Tasks: ${allTasks.length}`, summaryCol2X, yPosition)
            doc.text(`Overdue Orders: ${filteredData.filter((o) => o.isOverdue).length}`, summaryCol3X, yPosition)
            yPosition += 6

            doc.text(`Completed Tasks: ${allTasks.filter((t) => t.status === "COMPLETED").length}`, summaryCol1X, yPosition)
            doc.text(`In Progress: ${allTasks.filter((t) => t.status === "IN PROGRESS").length}`, summaryCol2X, yPosition)
            doc.text(`Blocked: ${allTasks.filter((t) => t.status === "BLOCKED").length}`, summaryCol3X, yPosition)
            yPosition += 6

            doc.text(`Not Started: ${allTasks.filter((t) => t.status === "NOT STARTED").length}`, summaryCol1X, yPosition)
            doc.text(`Urgent Items: ${filteredData.filter((o) => o.isUrgent).length}`, summaryCol2X, yPosition)
            yPosition += 12

            doc.setFont(undefined, "bold")
            doc.text("Task Status by Unit:", 14, yPosition)
            yPosition += 8

            doc.setFont(undefined, "normal")
            const taskStatusCounts = allTasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1
                return acc
            }, {})

            Object.entries(taskStatusCounts).forEach(([status, count]) => {
                doc.text(`${status}: ${count}`, 20, yPosition)
                yPosition += 6
            })
            yPosition += 10

            doc.setFont(undefined, "bold")
            doc.text("Detailed Orders and Tasks:", 14, yPosition)
            yPosition += 8

            const tableData = []
            filteredData.forEach((order) => {
                if (order.tasks.length > 0) {
                    order.tasks.forEach((task) => {
                        tableData.push([
                            order.customer_name,
                            new Date(order.order_date).toLocaleDateString(),
                            order.due_date ? new Date(order.due_date).toLocaleDateString() : "N/A",
                            order.isOverdue ? "OVERDUE" : order.daysUntilDue > 0 ? `${order.daysUntilDue} days` : "Due",
                            task.name,
                            task.task_unit || task.purchase_order_unit,
                            task.status,
                        ])
                    })
                } else {
                    tableData.push([
                        order.customer_name,
                        new Date(order.order_date).toLocaleDateString(),
                        order.due_date ? new Date(order.due_date).toLocaleDateString() : "N/A",
                        order.isOverdue ? "OVERDUE" : order.daysUntilDue > 0 ? `${order.daysUntilDue} days` : "Due",
                        "No tasks",
                        "-",
                        "-",
                    ])
                }
            })

            autoTable(doc, {
                head: [["Customer", "Order Date", "Due Date", "Status", "Task Name", "Task Unit", "Task Status"]],
                body: tableData,
                startY: yPosition,
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 7, cellPadding: 1.5 },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 50 },
                    5: { cellWidth: 30 },
                    6: { cellWidth: 25 },
                },
                didDrawCell: (data) => {
                    if (data.column.index === 3 && data.cell.text[0] === "OVERDUE") {
                        doc.setFillColor(255, 0, 0, 0.1)
                    }
                },
            })

            if (validCharts.length > 0) {
                doc.addPage()
                yPosition = 20

                doc.setFontSize(14)
                doc.setFont(undefined, "bold")
                doc.text("Analytics Charts", 14, yPosition)
                yPosition += 15

                const chartWidth = 130
                const chartHeight = 85
                const chartSpacing = 10

                validCharts.forEach(([chartId, chart], index) => {
                    const row = Math.floor(index / 2)
                    const col = index % 2

                    const chartX = 14 + col * (chartWidth + chartSpacing)
                    const chartY = yPosition + row * (chartHeight + chartSpacing)

                    // Add new page if needed
                    if (chartY + chartHeight > 180) {
                        doc.addPage()
                        yPosition = 20
                        const newRow = index - Math.floor(index / 2) * 2
                        const newChartY = yPosition + newRow * (chartHeight + chartSpacing)

                        try {
                            doc.setFontSize(10)
                            doc.setFont(undefined, "bold")
                            doc.text(chart.name, chartX, newChartY - 3)
                            doc.addImage(chart.dataUrl, "PNG", chartX, newChartY, chartWidth, chartHeight)
                        } catch (error) {
                            console.warn(`Failed to add chart ${chartId} to PDF:`, error)
                        }
                    } else {
                        try {
                            doc.setFontSize(10)
                            doc.setFont(undefined, "bold")
                            doc.text(chart.name, chartX, chartY - 3)
                            doc.addImage(chart.dataUrl, "PNG", chartX, chartY, chartWidth, chartHeight)
                        } catch (error) {
                            console.warn(`Failed to add chart ${chartId} to PDF:`, error)
                        }
                    }
                })
            }

            doc.save(`sidhu_textiles_report_${new Date().toISOString().slice(0, 10)}.pdf`)

            if (toast?.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Export Complete",
                    detail: `PDF exported successfully with ${validCharts.length} charts included`,
                    life: 3000,
                })
            }
        } catch (error) {
            console.error("PDF Export Error:", error)
            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Export Failed",
                    detail: "Failed to export PDF: " + error.message,
                    life: 3000,
                })
            }
        }
    }

    const handlePrint = async () => {
        try {
            if (toast?.current) {
                toast.current.show({
                    severity: "info",
                    summary: "Preparing Print",
                    detail: "Capturing charts for print...",
                    life: 5000,
                })
            }

            const charts = await captureCharts()
            const validCharts = Object.entries(charts).filter(([_, chart]) => chart.dataUrl && !chart.error)

            const printWindow = window.open("", "", "width=1400,height=900")

            const chartHtml =
                validCharts.length > 0
                    ? validCharts
                        .map(
                            ([chartId, chart]) =>
                                `<div class="chart-container">
              <h4>${chart.name}</h4>
              <img src="${chart.dataUrl}" alt="${chart.name}" style="max-width: 100%; height: auto; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;" />
            </div>`,
                        )
                        .join("")
                    : '<div class="chart-container"><p>No charts available for print</p></div>'

            const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 11px;
            }
            .letterhead {
              border-bottom: 3px solid #007bff;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .letterhead h1 {
              font-size: 24px;
              margin: 0 0 5px 0;
              color: #007bff;
            }
            .letterhead .tagline {
              font-size: 11px;
              font-weight: bold;
              color: #555;
              margin: 5px 0;
            }
            .letterhead .address {
              font-size: 10px;
              color: #666;
              line-height: 1.4;
            }
            .letterhead .ref-date {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 10px;
              font-weight: bold;
            }
            .letterhead h1 {
              display: flex;
              justify-content: center;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
              font-size: 18px;
              margin-top: 20px;
            }
            h2 {
              color: #555;
              font-size: 16px;
              margin-top: 25px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            h4 {
              color: #555;
              margin: 15px 0 5px 0;
              font-size: 14px;
            }
            .summary {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            .summary-item {
              font-weight: bold;
              padding: 10px;
              background: white;
              border-radius: 3px;
              border-left: 4px solid #007bff;
            }
            .urgent { border-left-color: #dc3545 !important; }
            .overdue { border-left-color: #fd7e14 !important; }
            .task-status-breakdown {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .task-status-breakdown h3 {
              font-size: 14px;
              margin: 0 0 10px 0;
              color: #333;
            }
            .task-status-breakdown ul {
              list-style: none;
              padding: 0;
              margin: 0;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
            }
            .task-status-breakdown li {
              background: white;
              padding: 8px 12px;
              border-radius: 3px;
              border-left: 3px solid #007bff;
            }
            .charts-section {
              margin: 30px 0;
              page-break-before: always;
            }
            .charts-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
              gap: 20px;
              margin: 20px 0;
            }
            .chart-container {
              text-align: center;
              page-break-inside: avoid;
              background: white;
              padding: 15px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px; 
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
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
              font-size: 9px;
              font-weight: bold;
            }
            .badge-success { background-color: #28a745; color: white; }
            .badge-warning { background-color: #ffc107; color: black; }
            .badge-danger { background-color: #dc3545; color: white; }
            .badge-secondary { background-color: #6c757d; color: white; }
            .badge-primary { background-color: #007bff; color: white; }
            .badge-info { background-color: #17a2b8; color: white; }
            .overdue-row { background-color: #fff5f5 !important; }
            .urgent-row { background-color: #fef5e7 !important; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .charts-section { page-break-before: always; }
              .chart-container { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <h1>SIDHU Textiles</h1>
            <div class="tagline">MFRS: EXPORTERS OF HIGH CLASS HOSIERY & SPORTS WEARS</div>
            <div class="address">
              17/1, Near Sivan Theatre (North), I st Street<br>
              Kumaranandhapuram, TIRUPUR - 641 602.<br>
              Phone: 0421 - 2477863, 94430 31108<br>
              GSTIN: 33ACWPM6268J1ZV
            </div>
            <div class="ref-date">
              <span>Ref: ORD-${new Date().getTime()}</span>
              <span>Date: ${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <h1>Orders and Tasks Analysis Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          
          <div class="summary">
            <div class="summary-item">Total Orders: ${filteredData.length}</div>
            <div class="summary-item">Total Tasks: ${allTasks.length}</div>
            <div class="summary-item">Completed Tasks: ${allTasks.filter((t) => t.status === "COMPLETED").length}</div>
            <div class="summary-item">Active Tasks: ${allTasks.filter((t) => t.status === "IN PROGRESS").length}</div>
            <div class="summary-item overdue">Overdue Orders: ${filteredData.filter((o) => o.isOverdue).length}</div>
            <div class="summary-item urgent">Urgent Items: ${filteredData.filter((o) => o.isUrgent).length}</div>
          </div>

          <div class="task-status-breakdown">
            <h3>Task Status Breakdown</h3>
            <ul>
              ${Object.entries(
                allTasks.reduce((acc, task) => {
                    acc[task.status] = (acc[task.status] || 0) + 1
                    return acc
                }, {}),
            )
                    .map(([status, count]) => `<li><strong>${status}:</strong> ${count} tasks</li>`)
                    .join("")}
            </ul>
          </div>

          <h2>Detailed Orders and Tasks</h2>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Task Name</th>
                <th>Task Unit</th>
                <th>Task Status</th>
                <th>Product/Color</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                    .map((order) => {
                        const rowClass = order.isOverdue ? "overdue-row" : order.isUrgent ? "urgent-row" : ""
                        if (order.tasks.length > 0) {
                            return order.tasks
                                .map(
                                    (task) => `
                    <tr class="${rowClass}">
                      <td>${order.customer_name}</td>
                      <td>${new Date(order.order_date).toLocaleDateString()}</td>
                      <td>${order.due_date ? new Date(order.due_date).toLocaleDateString() : "N/A"}</td>
                      <td>
                        ${order.isOverdue
                                            ? '<span class="badge badge-danger">OVERDUE</span>'
                                            : order.daysUntilDue !== null
                                                ? order.daysUntilDue > 0
                                                    ? `${order.daysUntilDue} days left`
                                                    : "Due today"
                                                : "N/A"
                                        }
                      </td>
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
                    <tr class="${rowClass}">
                      <td>${order.customer_name}</td>
                      <td>${new Date(order.order_date).toLocaleDateString()}</td>
                      <td>${order.due_date ? new Date(order.due_date).toLocaleDateString() : "N/A"}</td>
                      <td>
                        ${order.isOverdue
                                    ? '<span class="badge badge-danger">OVERDUE</span>'
                                    : order.daysUntilDue !== null
                                        ? order.daysUntilDue > 0
                                            ? `${order.daysUntilDue} days left`
                                            : "Due today"
                                        : "N/A"
                                }
                      </td>
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

                    if (toast?.current) {
                        toast.current.show({
                            severity: "success",
                            summary: "Print Ready",
                            detail: `Print dialog opened with ${validCharts.length} charts included`,
                            life: 3000,
                        })
                    }
                }, 2000)
            }
        } catch (error) {
            console.error("Print Error:", error)
            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Print Failed",
                    detail: "Failed to open print dialog: " + error.message,
                    life: 3000,
                })
            }
        }
    }

    // Main Render
    return (
        <div className="p-3 p-md-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="h2 fw-bold mb-1 text-primary">
                        <FaChartBar className="me-2" />
                        Overview & Analysis
                    </h1>
                    <p className="text-muted mb-0">Complete analysis with interactive charts and due date tracking</p>
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
                            {/* <FaFileCsv className="me-1" /> */}
                            Export Analysis
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={exportToCsv}>
                                <FaFileCsv className="me-2" />
                                Export as CSV
                            </Dropdown.Item>
                            {/* <Dropdown.Item onClick={exportToPdf}>
                                <FaFilePdf className="me-2" />
                                Export as PDF (with Charts)
                            </Dropdown.Item> */}
                            <Dropdown.Item onClick={handlePrint}>
                                <FaPrint className="me-2" />
                                Print
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
                                    <Form.Check
                                        type="checkbox"
                                        id="overdue-filter"
                                        label="Show Overdue Orders Only"
                                        checked={showOverdueOnly}
                                        onChange={(e) => setShowOverdueOnly(e.target.checked)}
                                        className="mt-4"
                                    />
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
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th>Types</th>
                                        <th>Notes</th>
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
                                                        borderLeft: `4px solid ${order.isOverdue ? "#dc3545" : order.isUrgent ? "#fd7e14" : "#007bff"}`,
                                                    }}
                                                    onClick={() => order.tasks.length > 0 && toggleOrderExpansion(order.order_id)}
                                                    className={order.isOverdue ? "table-danger" : order.isUrgent ? "table-warning" : ""}
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
                                                        {order.isUrgent && (
                                                            <div>
                                                                <Badge bg="danger" className="small">
                                                                    <FaFire className="me-1" />
                                                                    URGENT
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <FaCalendarAlt className="me-1 text-muted" />
                                                        {new Date(order.order_date).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        {order.due_date ? (
                                                            <div>
                                                                <FaCalendarTimes className={`me-1 ${order.isOverdue ? "text-danger" : "text-muted"}`} />
                                                                {new Date(order.due_date).toLocaleDateString()}
                                                                {order.daysUntilDue !== null && (
                                                                    <div>
                                                                        <small className={order.isOverdue ? "text-danger fw-bold" : "text-muted"}>
                                                                            {order.isOverdue
                                                                                ? `${Math.abs(order.daysUntilDue)} days overdue`
                                                                                : `${order.daysUntilDue} days left`}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">No due date</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {order.isOverdue ? (
                                                            <Badge bg="danger">
                                                                <FaExclamationCircle className="me-1" />
                                                                OVERDUE
                                                            </Badge>
                                                        ) : areAllTasksCompleted(order.tasks) ? (
                                                            <Badge bg="success">
                                                                <FaCheckCircle className="me-1" />
                                                                COMPLETED
                                                            </Badge>
                                                        ) : order.daysUntilDue !== null && order.daysUntilDue <= 3 ? (
                                                            <Badge bg="warning" text="dark">
                                                                <FaClock className="me-1" />
                                                                DUE SOON
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="info" text="white">
                                                                <FaCheckCircle className="me-1" />
                                                                ON TIME
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="text-muted">{order.types || "N/A"}</span>
                                                    </td>
                                                    <td>
                                                        {order.special_notes &&
                                                            order.special_notes.trim() !== "" &&
                                                            (() => {
                                                                // Safely parse in case it's JSON or just plain text
                                                                let notes = []
                                                                try {
                                                                    const parsed = JSON.parse(order.special_notes)
                                                                    if (Array.isArray(parsed)) {
                                                                        notes = parsed
                                                                    } else if (typeof parsed === "object") {
                                                                        notes = Object.entries(parsed).map(([key, value]) => `${key}: ${value}`)
                                                                    } else {
                                                                        notes = [String(parsed)]
                                                                    }
                                                                } catch {
                                                                    // fallback: just treat as plain string
                                                                    notes = [order.special_notes]
                                                                }

                                                                const popover = (
                                                                    <Popover id="special-notes-popover">
                                                                        <Popover.Header as="h3">Special Notes</Popover.Header>
                                                                        <Popover.Body>
                                                                            <div className="grid grid-cols-1 gap-2">
                                                                                {notes.map((note, idx) => (
                                                                                    <div key={idx} className="d-flex flex-column border-bottom pb-1 mb-1">
                                                                                        <span>{note.trim() !== "" ? note : "No details"}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </Popover.Body>
                                                                    </Popover>
                                                                )

                                                                return (
                                                                    <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
                                                                        <Badge bg="info" className="me-1" style={{ cursor: "pointer" }}>
                                                                            <i className="bi bi-journal-text"></i>
                                                                        </Badge>
                                                                    </OverlayTrigger>
                                                                )
                                                            })()}
                                                        {order.purchase_unit_notes &&
                                                            (() => {
                                                                const notesObj = parseJsonSafe(order.purchase_unit_notes)
                                                                const popover = (
                                                                    <Popover id="unit-notes-popover">
                                                                        <Popover.Header as="h3">Unit Notes</Popover.Header>
                                                                        <Popover.Body>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                {Object.entries(notesObj).map(([unit, note]) => (
                                                                                    <div key={unit} className="d-flex flex-column border-bottom pb-1 mb-1">
                                                                                        <strong>{unit}</strong>
                                                                                        <span>{note && note.trim() !== "" ? note : "No notes"}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </Popover.Body>
                                                                    </Popover>
                                                                )

                                                                return (
                                                                    <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
                                                                        <Badge bg="secondary" className="me-1" style={{ cursor: "pointer" }}>
                                                                            <i className="bi bi-card-text"></i>
                                                                        </Badge>
                                                                    </OverlayTrigger>
                                                                )
                                                            })()}
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
                                                        <td colSpan="8" className="p-0">
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
                                                                                <tr
                                                                                    key={task.task_id || task.purchase_order_id}
                                                                                    className={task.status === "BLOCKED" ? "table-danger" : ""}
                                                                                >
                                                                                    <td>
                                                                                        <div className="fw-medium">{task.name}</div>
                                                                                        <small className="text-muted">ID: {task.task_id || task.purchase_order_id}</small>
                                                                                        {task.status === "BLOCKED" && (
                                                                                            <div>
                                                                                                <Badge bg="danger" className="small">
                                                                                                    <FaExclamationTriangle className="me-1" />
                                                                                                    URGENT - BLOCKED
                                                                                                </Badge>
                                                                                            </div>
                                                                                        )}
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
                                                                                        <div className="d-flex gap-1">
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
                                            <td colSpan="8" className="text-center p-5">
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

                <Tab
                    eventKey="timeline"
                    title={
                        <span>
                            <FaCalendarAlt className="me-1" />
                            Timeline View
                        </span>
                    }
                >
                    <TaskTimelineChart orders={filteredData} dateRange={dateRange} onDateRangeChange={setDateRange} />
                </Tab>
            </Tabs>
        </div>
    )
}

export default EnhancedConsolidatedOverview
