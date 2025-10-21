import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Row, Col, Badge, Table, Form, Spinner, Dropdown, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFileCsv, FaFilePdf, FaPrint, FaChevronDown, FaChevronRight, FaCut, FaEdit, FaBox, FaQuestion } from 'react-icons/fa';
import { GiSewingMachine, GiHeavyCollar } from 'react-icons/gi';
import { TbHttpGet } from 'react-icons/tb';
import { parseJsonSafe } from "../utils/jsonUtils";

// --- Helper Functions & Static Data ---

const TASK_UNITS = ["PROCUREMENT", "COLLAR", "CUTTING", "PRINTING", "EMBROIDERY", "STITCHING", "PACKAGING", "UNASSIGNED"];
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered"];
const TASK_STATUSES = ["NOT STARTED", "IN PROGRESS", "COMPLETED", "BLOCKED"];

const getOrderStatusVariant = (status) => {
    const mapping = {
        "Processing": "warning",
        "Shipped": "primary",
        "Delivered": "success",
        "Pending": "danger",
    };
    return mapping[status] || "secondary";
};

const getTaskStatusVariant = (status) => {
    const mapping = {
        "IN PROGRESS": "warning",
        "COMPLETED": "success",
        "BLOCKED": "danger",
        "NOT STARTED": "secondary",
    };
    return mapping[status] || "light";
};

const getTaskUnitVariant = (unit) => {
    const mapping = {
        "PROCUREMENT": "primary",
        "COLLAR": "secondary",
        "CUTTING": "danger",
        "PRINTING": "info",
        "EMBROIDERY": "warning",
        "STITCHING": "success",
        "PACKAGING": "dark",
    };
    return mapping[unit] || "light";
};

const getTaskUnitIcon = (unit) => {
    switch (unit) {
        case "PROCUREMENT": return <TbHttpGet className="me-1" />;
        case "COLLAR": return <GiHeavyCollar className="me-1" />;
        case "CUTTING": return <FaCut className="me-1" />;
        case "PRINTING": return <FaPrint className="me-1" />;
        case "EMBROIDERY": return <FaEdit className="me-1" />;
        case "STITCHING": return <GiSewingMachine className="me-1" />;
        case "PACKAGING": return <FaBox className="me-1" />;
        default: return <FaQuestion className="me-1" />;
    }
};


// --- Child Components ---

/**
 * Displays key performance indicators in a row of cards.
 */
const KpiCards = ({ orders, tasks }) => {
    const taskStatusCounts = useMemo(() => {
        return tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {});
    }, [tasks]);

    return (
        <Row className="g-3 mb-4">
            <Col md={6} lg={3}>
                <Card className="shadow-sm">
                    <Card.Body>
                        <div className="text-muted small">Total Orders</div>
                        <div className="h3 fw-bold">{orders.length}</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={6} lg={3}>
                <Card className="shadow-sm">
                    <Card.Body>
                        <div className="text-muted small">Total Tasks</div>
                        <div className="h3 fw-bold">{tasks.length}</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={12} lg={6}>
                <Card className="shadow-sm">
                    <Card.Body>
                        <div className="text-muted small mb-2">Tasks by Status</div>
                        <div className="d-flex flex-wrap gap-2">
                            {TASK_STATUSES.map(status => (
                                <Badge key={status} pill bg={getTaskStatusVariant(status)} className="fs-6 fw-normal p-2">
                                    {status}: {taskStatusCounts[status] || 0}
                                </Badge>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

/**
 * A reusable Task Unit Visualization component, adapted from your original file.
 */
const TaskUnitVisualization = ({ tasks = [] }) => {
    const unitStats = useMemo(() => {
        const stats = {};
        TASK_UNITS.forEach((unit) => {
            const unitTasks = tasks.filter((task) => task.task_unit === unit || task.purchase_order_unit === unit);
            const completed = unitTasks.filter((task) => task.status === "COMPLETED").length;
            stats[unit] = {
                total: unitTasks.length,
                completed,
                completionRate: unitTasks.length > 0 ? Math.round((completed / unitTasks.length) * 100) : 0,
            };
        });
        return stats;
    }, [tasks]);

    return (
        <Card className="shadow-sm">
            <Card.Header>
                <Card.Title as="h5">Task Progress by Production Unit</Card.Title>
            </Card.Header>
            <Card.Body>
                <Row className="g-4">
                    {TASK_UNITS.map((unit) => (
                        <Col key={unit} md={6} xl={4}>
                            <div className="d-flex align-items-center mb-1">
                                {getTaskUnitIcon(unit)}
                                <span className="fw-bold ms-1">{unit}</span>
                                <Badge bg="light" text="dark" className="ms-auto">{unitStats[unit]?.completed || 0} / {unitStats[unit]?.total || 0}</Badge>
                            </div>
                            <ProgressBar
                                now={unitStats[unit]?.completionRate || 0}
                                label={`${unitStats[unit]?.completionRate || 0}%`}
                                variant={getTaskUnitVariant(unit)}
                                striped
                            />
                        </Col>
                    ))}
                </Row>
            </Card.Body>
        </Card>
    );
};


/**
 * The main component for the comprehensive overview page.
 */
const ComprehensiveView = ({ toast }) => {
    // --- State Management ---
    const [allData, setAllData] = useState([]); // Array of orders with nested tasks
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtering state
    const [filterOrderStatus, setFilterOrderStatus] = useState("all");
    const [filterTaskStatus, setFilterTaskStatus] = useState("all");
    const [filterTaskUnit, setFilterTaskUnit] = useState("all");
    const [filterCustomer, setFilterCustomer] = useState("");

    // UI State
    const [expandedOrders, setExpandedOrders] = useState({});
    const [activeTab, setActiveTab] = useState('table');

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch all orders
                const ordersRes = await fetch(process.env.REACT_APP_GET_ALL_ORDERS);
                if (!ordersRes.ok) throw new Error("Failed to fetch orders");
                let orders = await ordersRes.json();
                orders = orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

                // 2. Fetch tasks for each order
                const tasksPromises = orders.map(order =>
                    fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${order.order_id || order.purchase_order_id || order.id}`)
                        .then(res => res.ok ? res.json() : [])
                );

                const tasksResults = await Promise.all(tasksPromises);

                // 3. Combine orders and tasks
                const combinedData = orders.map((order, index) => ({
                    ...order,
                    tasks: tasksResults[index] || [],
                }));

                setAllData(combinedData);

            } catch (err) {
                setError(err.message);
                console.error(err);
                if (toast) {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load comprehensive data.",
                        life: 3000,
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [toast]);

    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        return allData
            .map(order => {
                // Filter tasks first
                const tasks = order.tasks.filter(task =>
                    (filterTaskStatus === 'all' || task.status === filterTaskStatus) &&
                    (filterTaskUnit === 'all' || task.task_unit === filterTaskUnit)
                );

                // Return the order with its filtered tasks
                return { ...order, tasks };
            })
            .filter(order => {
                // Then, filter orders
                const orderStatusMatch = filterOrderStatus === 'all' || order.status === filterOrderStatus;
                const customerMatch = !filterCustomer || order.customer_name.toLowerCase().includes(filterCustomer.toLowerCase());

                // Keep the order if it matches the filter OR if it has any tasks that match the task filters
                return (orderStatusMatch && customerMatch) && (filterTaskStatus === 'all' && filterTaskUnit === 'all' ? true : order.tasks.length > 0);
            });
    }, [allData, filterOrderStatus, filterTaskStatus, filterTaskUnit, filterCustomer]);

    const allTasks = useMemo(() => filteredData.flatMap(order => order.tasks), [filteredData]);


    // --- UI Handlers ---
    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    // --- Exporting Logic ---
    const exportToCsv = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Order ID,Customer,Order Date,Order Status,Task ID,Task Name,Task Status,Task Unit,Product,Color,Dependencies\n";

        filteredData.forEach(order => {
            if (order.tasks.length > 0) {
                order.tasks.forEach(task => {
                    const row = [
                        order.order_id,
                        `"${order.customer_name}"`,
                        new Date(order.order_date).toLocaleDateString(),
                        order.status,
                        task.task_id,
                        `"${task.name}"`,
                        task.status,
                        task.task_unit,
                        task.product || "",
                        task.color || "",
                        `"${(parseJsonSafe(task.dependencies || '[]')).join(', ')}"`
                    ].join(",");
                    csvContent += row + "\n";
                });
            } else {
                const row = [
                    order.order_id,
                    `"${order.customer_name}"`,
                    new Date(order.order_date).toLocaleDateString(),
                    order.status,
                    "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A"
                ].join(",");
                csvContent += row + "\n";
            }
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "orders_and_tasks_analysis.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPdf = () => {
        const doc = new jsPDF();
        doc.text("Orders and Tasks Analysis", 14, 16);

        const head = [['Customer', 'Order Status', 'Task Name', 'Task Unit', 'Task Status']];
        const body = [];

        filteredData.forEach(order => {
            order.tasks.forEach(task => {
                body.push([
                    order.customer_name,
                    order.status,
                    task.name,
                    task.task_unit,
                    task.status
                ]);
            });
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: 22,
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 },
        });

        doc.save('orders_and_tasks_analysis.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" variant="primary" />
                <h4 className="ms-3">Loading comprehensive data...</h4>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger">Error: {error}</div>;
    }

    return (
        <div className="p-3 p-md-4">
            <style type="text/css">
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-area, .printable-area * {
                            visibility: visible;
                        }
                        .printable-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                `}
            </style>

            <div className="printable-area">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 no-print">
                    <h1 className="h2 fw-bold mb-0">Comprehensive Overview</h1>
                    <div className="d-flex gap-2">
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-export">
                                Export Analysis
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={exportToCsv}><FaFileCsv className="me-2" />Export as CSV</Dropdown.Item>
                                <Dropdown.Item onClick={exportToPdf}><FaFilePdf className="me-2" />Export as PDF</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button variant="outline-secondary" onClick={handlePrint}>
                            <span title="For best results, disable Headers/Footers and enable Background Graphics in the print dialog.">
                                <FaPrint className="me-2" />Print View
                            </span>
                        </Button>
                    </div>
                </div>

                <div className="no-print">
                    <KpiCards orders={filteredData} tasks={allTasks} />

                    <Card className="shadow-sm mb-4">
                        <Card.Header>
                            <Card.Title as="h5">Filters</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6} lg={3}>
                                    <Form.Group>
                                        <Form.Label>Customer Name</Form.Label>
                                        <Form.Control type="text" placeholder="Search customer..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={6} lg={3}>
                                    <Form.Group>
                                        <Form.Label>Order Status</Form.Label>
                                        <Form.Select value={filterOrderStatus} onChange={e => setFilterOrderStatus(e.target.value)}>
                                            <option value="all">All</option>
                                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6} lg={3}>
                                    <Form.Group>
                                        <Form.Label>Task Status</Form.Label>
                                        <Form.Select value={filterTaskStatus} onChange={e => setFilterTaskStatus(e.target.value)}>
                                            <option value="all">All</option>
                                            {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6} lg={3}>
                                    <Form.Group>
                                        <Form.Label>Task Unit</Form.Label>
                                        <Form.Select value={filterTaskUnit} onChange={e => setFilterTaskUnit(e.target.value)}>
                                            <option value="all">All</option>
                                            {TASK_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </div>


                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 nav-pills no-print">
                    <Tab eventKey="table" title="📋 Orders & Tasks View">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Table responsive hover className="align-middle">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Customer</th>
                                            <th>Order Date</th>
                                            <th>Order Status</th>
                                            <th className="text-center">Task Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map(order => {
                                            return [
                                                <tr key={order.order_id} style={{ cursor: 'pointer', borderLeft: `4px solid var(--bs-${getOrderStatusVariant(order.status)})` }} onClick={() => toggleOrderExpansion(order.order_id)}>
                                                    <td>
                                                        {order.tasks.length > 0 && (
                                                            expandedOrders[order.order_id]
                                                                ? <FaChevronDown size={14} />
                                                                : <FaChevronRight size={14} />
                                                        )}
                                                    </td>
                                                    <td className="fw-bold">{order.customer_name}</td>
                                                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                                    <td><Badge bg={getOrderStatusVariant(order.status)}>{order.status}</Badge></td>
                                                    <td className="text-center"><Badge bg="light" text="dark">{order.tasks.length}</Badge></td>
                                                </tr>,
                                                expandedOrders[order.order_id] && (
                                                    <tr key={order.order_id + "-expanded"}>
                                                        <td colSpan="5" className="p-0">
                                                            <div className="p-3 bg-light">
                                                                {order.tasks.length > 0 ? (
                                                                    <Table bordered size="sm" className="bg-white mb-0">
                                                                        <thead className="table-dark">
                                                                            <tr>
                                                                                <th>Task Name</th>
                                                                                <th>Unit</th>
                                                                                <th>Status</th>
                                                                                <th>Product / Color</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {order.tasks.map(task => (
                                                                                <tr key={task.task_id || task.purchase_order_id}>
                                                                                    <td>{task.name}</td>
                                                                                    <td><Badge bg={getTaskUnitVariant(task.task_unit)}>{getTaskUnitIcon(task.task_unit)} {task.task_unit}</Badge></td>
                                                                                    <td><Badge bg={getTaskStatusVariant(task.status)}>{task.status}</Badge></td>
                                                                                    <td>{task.product}{task.color && ` - ${task.color}`}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                ) : (
                                                                    <div className="text-center text-muted p-3">No tasks match the current filters for this order.</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            ];
                                        })}
                                        {filteredData.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center p-4">
                                                    No orders match the current filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="analysis" title="📊 Task Unit Analysis">
                        <TaskUnitVisualization tasks={allTasks} />
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
};

export default ComprehensiveView;
