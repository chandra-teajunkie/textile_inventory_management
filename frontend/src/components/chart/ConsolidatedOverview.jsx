import React, { useState, useEffect, useMemo } from "react";
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
    Alert,
    Tabs,
    Tab,
    ProgressBar,
} from "react-bootstrap";
import { jsPDF } from "jspdf"; // keep if you plan to add PDF later
import autoTable from "jspdf-autotable"; // keep if you plan to add PDF later
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
    FaChartLine,
    FaEye,
    FaDownload,
} from "react-icons/fa";
import { GiSewingMachine, GiHeavyCollar } from "react-icons/gi";
import { TbHttpGet } from "react-icons/tb";
import ChartAnalysisUI from "./chartAnalysis";

// --- Constants ---
const TASK_UNITS = [
    "PROCUREMENT",
    "COLLAR",
    "CUTTING",
    "PRINTING",
    "EMBROIDERY",
    "STITCHING",
    "PACKAGING",
    "UNASSIGNED",
];
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered"];
const TASK_STATUSES = ["NOT STARTED", "IN PROGRESS", "COMPLETED", "BLOCKED"];

const getOrderStatusVariant = (status) => {
    const mapping = {
        Processing: "warning",
        Shipped: "primary",
        Delivered: "success",
        Pending: "danger",
    };
    return mapping[status] || "secondary";
};

const getTaskStatusVariant = (status) => {
    const mapping = {
        "IN PROGRESS": "warning",
        COMPLETED: "success",
        BLOCKED: "danger",
        "NOT STARTED": "secondary",
    };
    return mapping[status] || "light";
};

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
    };
    return mapping[unit] || "light";
};

const getTaskUnitIcon = (unit) => {
    switch (unit) {
        case "PROCUREMENT":
            return <TbHttpGet className="me-1" />;
        case "COLLAR":
            return <GiHeavyCollar className="me-1" />;
        case "CUTTING":
            return <FaCut className="me-1" />;
        case "PRINTING":
            return <FaPrintIcon className="me-1" />;
        case "EMBROIDERY":
            return <FaEdit className="me-1" />;
        case "STITCHING":
            return <GiSewingMachine className="me-1" />;
        case "PACKAGING":
            return <FaBox className="me-1" />;
        default:
            return <FaQuestion className="me-1" />;
    }
};


// --- KPI Cards ---
const KpiCards = ({ orders, tasks }) => {
    const taskStatusCounts = useMemo(
        () =>
            tasks.reduce((acc, task) => {
                const k = task?.status || "NOT STARTED";
                acc[k] = (acc[k] || 0) + 1;
                return acc;
            }, {}),
        [tasks]
    );

    const orderStatusCounts = useMemo(
        () =>
            orders.reduce((acc, order) => {
                const status = order?.status || "Processing";
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {}),
        [orders]
    );

    const completionRate = useMemo(() => {
        if (!tasks.length) return 0;
        return Math.round(((taskStatusCounts.COMPLETED || 0) / tasks.length) * 100);
    }, [tasks.length, taskStatusCounts.COMPLETED]);

    const urgentTasks = useMemo(
        () =>
            tasks.filter(
                (t) => t.status === "BLOCKED" || t.status === "IN PROGRESS"
            ).length,
        [tasks]
    );

    const kpiCards = [
        {
            title: "Total Orders",
            value: orders.length,
            subtitle: `${orderStatusCounts.Delivered || 0} delivered`,
            icon: <FaClipboardList size={32} />,
            color: "primary",
            bgColor: "bg-primary",
        },
        {
            title: "Total Tasks",
            value: tasks.length,
            subtitle: `${taskStatusCounts["IN PROGRESS"] || 0} in progress`,
            icon: <FaTasks size={32} />,
            color: "info",
            bgColor: "bg-info",
        },
        {
            title: "Completion Rate",
            value: `${completionRate}%`,
            subtitle: `${taskStatusCounts.COMPLETED || 0} completed`,
            icon: <FaChartLine size={32} />,
            color: "success",
            bgColor: "bg-success",
            progress: completionRate,
        },
        {
            title: "Urgent Tasks",
            value: urgentTasks,
            subtitle: `${taskStatusCounts.BLOCKED || 0} blocked`,
            icon: <FaExclamationTriangle size={32} />,
            color: urgentTasks > 0 ? "warning" : "success",
            bgColor: urgentTasks > 0 ? "bg-warning" : "bg-success",
        },
    ];

    return (
        <Row className="g-4 mb-4">
            {kpiCards.map((kpi, i) => (
                <Col key={i} md={6} lg={3}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="position-relative overflow-hidden">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div
                                    className={`p-3 rounded-circle ${kpi.bgColor} bg-opacity-10 text-${kpi.color}`}
                                >
                                    {kpi.icon}
                                </div>
                                <div className={`opacity-10 text-${kpi.color} position-absolute end-0 me-n2`}>
                                    {React.cloneElement(kpi.icon, { size: 80 })}
                                </div>
                            </div>
                            <h6 className="text-muted mb-2 fw-medium">{kpi.title}</h6>
                            <div className="d-flex align-items-end justify-content-between">
                                <div>
                                    <h2 className={`fw-bold text-${kpi.color} mb-1`}>{kpi.value}</h2>
                                    <small className="text-muted">{kpi.subtitle}</small>
                                </div>
                            </div>
                            {typeof kpi.progress === "number" && (
                                <div className="mt-3">
                                    <ProgressBar now={kpi.progress} style={{ height: 8 }} />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

// --- Task Unit Visualization ---
const TaskUnitVisualization = ({ tasks = [] }) => {
    const unitStats = useMemo(() => {
        const stats = {};
        TASK_UNITS.forEach((unit) => {
            const unitTasks = tasks.filter((t) => (t?.task_unit || "UNASSIGNED") === unit);
            const completed = unitTasks.filter((t) => t.status === "COMPLETED").length;
            const inProgress = unitTasks.filter((t) => t.status === "IN PROGRESS").length;
            const blocked = unitTasks.filter((t) => t.status === "BLOCKED").length;
            const notStarted = unitTasks.filter((t) => t.status === "NOT STARTED").length;

            stats[unit] = {
                total: unitTasks.length,
                completed,
                inProgress,
                blocked,
                notStarted,
                completionRate: unitTasks.length ? Math.round((completed / unitTasks.length) * 100) : 0,
            };
        });
        return stats;
    }, [tasks]);

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-primary text-white">
                <div className="d-flex align-items-center">
                    <FaChartBar className="me-2" />
                    <Card.Title as="h5" className="mb-0 text-white">
                        Production Unit Analysis
                    </Card.Title>
                </div>
            </Card.Header>
            <Card.Body className="p-4">
                <Row className="g-4">
                    {TASK_UNITS.map((unit) => {
                        const stats = unitStats[unit];
                        return (
                            <Col key={unit} md={6} xl={4}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <Card.Header
                                        className="text-white"
                                        style={{
                                            background: `linear-gradient(135deg, var(--bs-${getTaskUnitVariant(
                                                unit
                                            )}) 0%, var(--bs-${getTaskUnitVariant(unit)}) 100%)`,
                                        }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center">
                                                {getTaskUnitIcon(unit)}
                                                <span className="fw-bold">{unit}</span>
                                            </div>
                                            <Badge bg="light" text="dark" className="fw-bold">
                                                {stats.total}
                                            </Badge>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="p-3">
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-2">
                                                <small className="fw-bold text-muted">Progress</small>
                                                <small className="fw-bold">{stats.completionRate}%</small>
                                            </div>
                                            <ProgressBar now={stats.completionRate} style={{ height: 8 }} />
                                        </div>

                                        {stats.total > 0 ? (
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {stats.completed > 0 && <Badge bg="success">{stats.completed} Done</Badge>}
                                                {stats.inProgress > 0 && <Badge bg="warning">{stats.inProgress} Active</Badge>}
                                                {stats.blocked > 0 && <Badge bg="danger">{stats.blocked} Blocked</Badge>}
                                                {stats.notStarted > 0 && (
                                                    <Badge bg="secondary">{stats.notStarted} Pending</Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted py-3">
                                                <FaTasks size={24} className="mb-2 opacity-50" />
                                                <div>
                                                    <small>No tasks assigned</small>
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </Card.Body>
        </Card>
    );
};

// --- Main ---
const ConsolidatedOverview = () => {
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filterOrderStatus, setFilterOrderStatus] = useState("all");
    const [filterTaskStatus, setFilterTaskStatus] = useState("all");
    const [filterTaskUnit, setFilterTaskUnit] = useState("all");
    const [filterCustomer, setFilterCustomer] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // UI
    const [expandedOrders, setExpandedOrders] = useState({});
    const [activeKey, setActiveKey] = useState("overview");
    const [showFilters, setShowFilters] = useState(false);

    // Mock fetch
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const mockOrders = [
                    { order_id: "ORD001", customer_name: "Acme Corp", order_date: "2024-01-15", status: "Processing", types: "Shirts, Pants" },
                    { order_id: "ORD002", customer_name: "Tech Solutions", order_date: "2024-01-20", status: "Shipped", types: "Uniforms" },
                    { order_id: "ORD003", customer_name: "Fashion House", order_date: "2024-01-25", status: "Delivered", types: "Dresses" },
                ];
                const mockTasks = [
                    { task_id: "TASK001", name: "Cut fabric for shirts", status: "COMPLETED", task_unit: "CUTTING", product: "Shirt", color: "Blue" },
                    { task_id: "TASK002", name: "Stitch pants", status: "IN PROGRESS", task_unit: "STITCHING", product: "Pants", color: "Black" },
                    { task_id: "TASK003", name: "Package uniforms", status: "BLOCKED", task_unit: "PACKAGING", product: "Uniform", color: "Navy" },
                    { task_id: "TASK004", name: "Procure materials", status: "NOT STARTED", task_unit: "PROCUREMENT", product: "Dress", color: "Red" },
                ];
                const combined = mockOrders.map((order, i) => ({
                    ...order,
                    tasks: mockTasks.filter((_, idx) => idx % mockOrders.length === i),
                }));
                setAllData(combined);
            } catch (e) {
                setError(e.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Filtering
    const filteredData = useMemo(() => {
        return allData
            .map((order) => {
            const tasks = (order.tasks || []).filter((t) => {
                const statusOk = filterTaskStatus === "all" || t.status === filterTaskStatus;
                const unitOk = filterTaskUnit === "all" || (t.task_unit || "").toUpperCase() === filterTaskUnit;
                    return statusOk && unitOk;
                });
                return { ...order, tasks };
            })
            .filter((order) => {
                const orderStatusMatch =
                    filterOrderStatus === "all" || (order.status || "Processing") === filterOrderStatus;
                const customerMatch =
                    !filterCustomer ||
                    (order.customer_name || "").toLowerCase().includes(filterCustomer.toLowerCase());

                let dateOk = true;
                if (dateRange.start || dateRange.end) {
                    const d = order.order_date ? new Date(order.order_date) : null;
                    if (d) {
                        if (dateRange.start) dateOk = dateOk && d >= new Date(dateRange.start);
                        if (dateRange.end) dateOk = dateOk && d <= new Date(dateRange.end);
                    }
                }
                return orderStatusMatch && customerMatch && dateOk;
            });
    }, [allData, filterOrderStatus, filterTaskStatus, filterTaskUnit, filterCustomer, dateRange]);

    const allTasks = useMemo(() => filteredData.flatMap((o) => o.tasks || []), [filteredData]);

    // Handlers
    const toggleOrderExpansion = (id) =>
        setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));

    const clearAllFilters = () => {
        setFilterOrderStatus("all");
        setFilterTaskStatus("all");
        setFilterTaskUnit("all");
        setFilterCustomer("");
        setDateRange({ start: "", end: "" });
    };

    const exportToCsv = () => {
        try {
            let csv =
                "Order ID,Customer,Order Date,Order Status,Order Types,Task ID,Task Name,Task Status,Task Unit,Product,Color\n";
            filteredData.forEach((order) => {
                if ((order.tasks || []).length) {
                    order.tasks.forEach((task) => {
                        const row = [
                            order.order_id,
                            `"${order.customer_name}"`,
                            order.order_date ? new Date(order.order_date).toLocaleDateString() : "",
                            order.status || "Processing",
                            `"${order.types || ""}"`,
                            task.task_id || task.purchase_order_id,
                            `"${task.name}"`,
                            task.status,
                            task.task_unit,
                            task.product || "",
                            task.color || "",
                        ].join(",");
                        csv += row + "\n";
                    });
                } else {
                    const row = [
                        order.order_id,
                        `"${order.customer_name}"`,
                        order.order_date ? new Date(order.order_date).toLocaleDateString() : "",
                        order.status || "Processing",
                        `"${order.types || ""}"`,
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                    ].join(",");
                    csv += row + "\n";
                }
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `orders_tasks_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("CSV Export Error:", e);
        }
    };

    // Loading / Error
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
                    <h4 className="mt-3 text-muted">Loading comprehensive data...</h4>
                    <p className="text-muted">Please wait while we fetch all orders and tasks</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="m-4">
                <Alert.Heading>Error Loading Data</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="p-3 p-md-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="h2 fw-bold mb-1 text-primary">
                        <FaChartBar className="me-2" />
                        Business Intelligence Dashboard
                    </h1>
                    <p className="text-muted mb-0">Complete analysis of orders, tasks, and production metrics</p>
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
                            <FaDownload className="me-1" />
                            Export Data
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={exportToCsv}>
                                <FaFileCsv className="me-2" />
                                Export as CSV
                            </Dropdown.Item>
                            <Dropdown.Item disabled>
                                <FaFilePdf className="me-2" />
                                Export as PDF (coming soon)
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => window.print()}>
                                <FaPrint className="me-2" />
                                Print Report
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            {/* KPI */}
            <KpiCards orders={filteredData} tasks={allTasks} />

            {/* Filters */}
            {showFilters && (
                <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <FaFilter className="me-2 text-primary" />
                            <Card.Title as="h5" className="mb-0">
                                Advanced Filters
                            </Card.Title>
                        </div>
                        <Button variant="outline-secondary" size="sm" onClick={clearAllFilters}>
                            Clear All
                        </Button>
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
                                    <Form.Select
                                        value={filterOrderStatus}
                                        onChange={(e) => setFilterOrderStatus(e.target.value)}
                                    >
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
                                    <Form.Select
                                        value={filterTaskStatus}
                                        onChange={(e) => setFilterTaskStatus(e.target.value)}
                                    >
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
                                    <Form.Select
                                        value={filterTaskUnit}
                                        onChange={(e) => setFilterTaskUnit(e.target.value)}
                                    >
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
                                        onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
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
                                        onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Tabs */}
            <Tabs activeKey={activeKey} onSelect={(k) => setActiveKey(k || "overview")} className="mb-4">
                <Tab
                    eventKey="overview"
                    title={
                        <span className="d-inline-flex align-items-center">
                            <FaEye className="me-2" /> Overview ({filteredData.length})
                        </span>
                    }
                >
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-0">
                            <Table responsive hover className="align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: 40 }} />
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
                                        const completed = (order.tasks || []).filter((t) => t.status === "COMPLETED").length;
                                        const total = (order.tasks || []).length;
                                        const pct = total ? Math.round((completed / total) * 100) : 0;

                                        return (
                                            <React.Fragment key={order.order_id}>
                                                <tr
                                                    style={{
                                                        cursor: total > 0 ? "pointer" : "default",
                                                        borderLeft: `4px solid var(--bs-${getOrderStatusVariant(
                                                            order.status || "Processing"
                                                        )})`,
                                                    }}
                                                    onClick={() => total > 0 && toggleOrderExpansion(order.order_id)}
                                                >
                                                    <td>
                                                        {total > 0 &&
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
                                                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : "-"}
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
                                                            {total}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        {total ? (
                                                            <div style={{ minWidth: 120 }}>
                                                                <div className="d-flex justify-content-between mb-1">
                                                                    <small>
                                                                        {completed}/{total}
                                                                    </small>
                                                                    <small>{pct}%</small>
                                                                </div>
                                                                <ProgressBar now={pct} style={{ height: 8 }} />
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">No tasks</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {expandedOrders[order.order_id] && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0">
                                                            <div className="p-3 bg-light border-top">
                                                                {total ? (
                                                                    <Table bordered size="sm" className="bg-white mb-0">
                                                                        <thead className="table-secondary">
                                                                            <tr>
                                                                                <th>Task Name</th>
                                                                                <th>Unit</th>
                                                                                <th>Status</th>
                                                                                <th>Product / Color</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {order.tasks.map((task) => (
                                                                                <tr key={task.task_id}>
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
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                ) : (
                                                                    <p className="text-muted mb-0">No tasks available for this order.</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab
                    eventKey="analytics"
                    title={
                        <span className="d-inline-flex align-items-center">
                            <FaChartBar className="me-2" /> Chart Analysis
                        </span>
                    }
                >
                    <ChartAnalysisUI orders={filteredData} tasks={allTasks} />
                </Tab>

                <Tab
                    eventKey="production"
                    title={
                        <span className="d-inline-flex align-items-center">
                            <FaTasks className="me-2" /> Production Units
                        </span>
                    }
                >
                    <TaskUnitVisualization tasks={allTasks} />
                </Tab>

                <Tab
                    eventKey="reports"
                    title={
                        <span className="d-inline-flex align-items-center">
                            <FaClipboardList className="me-2" /> Detailed Reports
                        </span>
                    }
                >
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">
                                <FaClipboardList className="me-2" />
                                Detailed Reports
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted mb-0">Detailed reporting features coming soon...</p>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
};

export default ConsolidatedOverview;
