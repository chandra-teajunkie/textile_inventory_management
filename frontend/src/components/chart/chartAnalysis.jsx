import React, { useState, useMemo } from "react";
import { Card, Row, Col, Button, ButtonGroup, Badge } from "react-bootstrap";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import {
    FaChartBar,
    FaChartPie,
    FaTasks,
    FaUsers,
    FaCalendarAlt,
    FaIndustry,
    FaCheckCircle,
    FaExclamationTriangle,
    FaClock,
    FaPlay,
    FaArrowUp,
    FaArrowDown,
} from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const ChartAnalysis = ({ orders = [], tasks = [] }) => {
    const [chartType, setChartType] = useState("bar");
    const [analysisType, setAnalysisType] = useState("task-status");

    // Chart color schemes
    const colorSchemes = {
        taskStatus: {
            COMPLETED: "#28a745",
            "IN PROGRESS": "#ffc107",
            BLOCKED: "#dc3545",
            "NOT STARTED": "#6c757d",
        },
        taskUnit: {
            PROCUREMENT: "#007bff",
            COLLAR: "#6c757d",
            CUTTING: "#dc3545",
            PRINTING: "#17a2b8",
            EMBROIDERY: "#ffc107",
            STITCHING: "#28a745",
            PACKAGING: "#343a40",
            UNASSIGNED: "#e9ecef",
        },
        orderStatus: {
            Pending: "#dc3545",
            Processing: "#ffc107",
            Shipped: "#007bff",
            Delivered: "#28a745",
        },
    };

    const getDatasetLabel = (type) => {
        const labels = {
            "task-status": "Tasks by Status",
            "task-unit": "Tasks by Unit",
            "order-status": "Orders by Status",
            "monthly-orders": "Orders by Month",
            "customer-orders": "Orders by Customer",
        };
        return labels[type] || "Count";
    };

    const getAnalysisIcon = (type) => {
        const icons = {
            "task-status": <FaTasks className="me-2" />,
            "task-unit": <FaIndustry className="me-2" />,
            "order-status": <FaCheckCircle className="me-2" />,
            "monthly-orders": <FaCalendarAlt className="me-2" />,
            "customer-orders": <FaUsers className="me-2" />,
        };
        return icons[type] || <FaChartBar className="me-2" />;
    };

    // Data processing
    const chartData = useMemo(() => {
        let data = {};
        let colors = [];
        let labels = [];

        switch (analysisType) {
            case "task-status": {
                data = tasks.reduce((acc, task) => {
                    const k = task?.status || "NOT STARTED";
                    acc[k] = (acc[k] || 0) + 1;
                    return acc;
                }, {});
                labels = Object.keys(data);
                colors = labels.map((l) => colorSchemes.taskStatus[l] || "#6c757d");
                break;
            }
            case "task-unit": {
                data = tasks.reduce((acc, task) => {
                    const unit = task?.purchase_order_unit || "UNASSIGNED";
                    acc[unit] = (acc[unit] || 0) + 1;
                    return acc;
                }, {});
                labels = Object.keys(data);
                colors = labels.map((l) => colorSchemes.taskUnit[l] || "#6c757d");
                break;
            }
            case "order-status": {
                data = orders.reduce((acc, order) => {
                    const status = order?.status || "Processing";
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});
                labels = Object.keys(data);
                colors = labels.map((l) => colorSchemes.orderStatus[l] || "#6c757d");
                break;
            }
            case "monthly-orders": {
                data = orders.reduce((acc, order) => {
                    const d = order?.order_date ? new Date(order.order_date) : null;
                    const month = d
                        ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : "Unknown";
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {});
                labels = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));
                colors = labels.map((_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)`);
                break;
            }
            case "customer-orders": {
                const byCustomer = orders.reduce((acc, order) => {
                    const name = order?.customer_name || "Unknown";
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});
                const top10 = Object.entries(byCustomer)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10);
                labels = top10.map(([n]) => n);
                data = Object.fromEntries(top10);
                colors = labels.map((_, i) => `hsl(${(i * 137.5) % 360}, 60%, 55%)`);
                break;
            }
            default:
                break;
        }

        return {
            labels,
            datasets: [
                {
                    label: getDatasetLabel(analysisType),
                    data: labels.map((l) => data[l] || 0),
                    backgroundColor: colors,
                    borderColor: colors.map((c) => c + "80"),
                    borderWidth: 2,
                    borderRadius: chartType === "bar" ? 4 : 0,
                    borderSkipped: false,
                },
            ],
        };
    }, [tasks, orders, analysisType, chartType]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: chartType === "pie" ? "right" : "top",
                labels: { usePointStyle: true, padding: 20, font: { size: 12 } },
            },
            title: {
                display: true,
                text: getDatasetLabel(analysisType),
                font: { size: 16, weight: "bold" },
                padding: 20,
            },
            tooltip: {
                backgroundColor: "rgba(0,0,0,0.8)",
                titleColor: "white",
                bodyColor: "white",
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: (ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : "0.0";
                        return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                    },
                },
            },
        },
        scales:
            chartType === "bar"
                ? {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { color: "rgba(0,0,0,0.1)" },
                    },
                    x: { grid: { display: false } },
                }
                : {},
    };

    const insights = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
        const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
        const totalOrders = orders.length;
        const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;

        return [
            {
                label: "Task Completion Rate",
                value: totalTasks ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%` : "0%",
                icon: <FaCheckCircle className="text-success" />,
                trend: completedTasks > totalTasks * 0.7 ? "up" : "down",
                color: "success",
            },
            {
                label: "Blocked Tasks",
                value: blockedTasks,
                icon: <FaExclamationTriangle className="text-danger" />,
                trend: blockedTasks > 0 ? "down" : "up",
                color: blockedTasks > 0 ? "danger" : "success",
            },
            {
                label: "Order Fulfillment",
                value: totalOrders ? `${((deliveredOrders / totalOrders) * 100).toFixed(1)}%` : "0%",
                icon: <FaCheckCircle className="text-primary" />,
                trend: deliveredOrders > totalOrders * 0.5 ? "up" : "down",
                color: "primary",
            },
            {
                label: "Active Tasks",
                value: tasks.filter((t) => t.status === "IN PROGRESS").length,
                icon: <FaPlay className="text-warning" />,
                trend: "up",
                color: "warning",
            },
        ];
    }, [tasks, orders]);

    return (
        <div className="chart-analysis-container">
            {/* Quick Insights */}
            <Row className="g-3 mb-4">
                {insights.map((insight, i) => (
                    <Col key={i} md={6} lg={3}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Body className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-1">
                                        {insight.icon}
                                        <small className="text-muted ms-1">{insight.label}</small>
                                    </div>
                                    <div className="h4 fw-bold mb-0">{insight.value}</div>
                                    <div className={`small text-${insight.color} d-flex align-items-center`}>
                                        {insight.trend === "up" ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                                        <span className="ms-1">
                                            {insight.trend === "up" ? "Trending up" : "Needs attention"}
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Chart Controls */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className="d-flex align-items-center">
                                <FaChartBar className="me-2 text-primary" />
                                <Card.Title as="h5" className="mb-0">
                                    Chart Analysis
                                </Card.Title>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="d-flex justify-content-end gap-2">
                                <ButtonGroup size="sm">
                                    <Button
                                        variant={chartType === "bar" ? "primary" : "outline-primary"}
                                        onClick={() => setChartType("bar")}
                                    >
                                        <FaChartBar className="me-1" />
                                        Bar
                                    </Button>
                                    <Button
                                        variant={chartType === "pie" ? "primary" : "outline-primary"}
                                        onClick={() => setChartType("pie")}
                                    >
                                        <FaChartPie className="me-1" />
                                        Pie
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body>
                    <Row className="mb-3">
                        <Col>
                            <div className="d-flex flex-wrap gap-2">
                                {[
                                    { key: "task-status", label: "Task Status", icon: <FaTasks /> },
                                    { key: "task-unit", label: "Task Units", icon: <FaIndustry /> },
                                    { key: "order-status", label: "Order Status", icon: <FaCheckCircle /> },
                                    { key: "monthly-orders", label: "Monthly Trends", icon: <FaCalendarAlt /> },
                                    { key: "customer-orders", label: "Top Customers", icon: <FaUsers /> },
                                ].map(({ key, label, icon }) => (
                                    <Button
                                        key={key}
                                        size="sm"
                                        variant={analysisType === key ? "primary" : "outline-secondary"}
                                        onClick={() => setAnalysisType(key)}
                                        className="d-flex align-items-center"
                                    >
                                        {icon}
                                        <span className="ms-1">{label}</span>
                                    </Button>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Main Chart */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            {getAnalysisIcon(analysisType)}
                            <h6 className="mb-0">{getDatasetLabel(analysisType)}</h6>
                        </div>
                        <Badge bg="light" text="dark">
                            {chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0} Total
                        </Badge>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div style={{ height: 400, position: "relative" }}>
                        {chartData.labels.length ? (
                            chartType === "bar" ? (
                                <Bar data={chartData} options={chartOptions} />
                            ) : (
                                <Pie data={chartData} options={chartOptions} />
                            )
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100">
                                <div className="text-center text-muted">
                                    <FaChartBar size={48} className="mb-3 opacity-50" />
                                    <h5>No Data Available</h5>
                                    <p>No data found for the selected analysis type.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Data Summary */}
            {!!chartData.labels.length && (
                <Card className="mt-4 border-0 shadow-sm">
                    <Card.Header className="bg-light">
                        <h6 className="mb-0">
                            <FaChartBar className="me-2" />
                            Data Summary
                        </h6>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {chartData.labels.map((label, i) => {
                                const value = chartData.datasets[0].data[i];
                                const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
                                const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
                                const color = chartData.datasets[0].backgroundColor[i];
                                return (
                                    <Col key={label} md={6} lg={4} xl={3} className="mb-3">
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="rounded-circle me-3"
                                                style={{ width: 12, height: 12, backgroundColor: color, flexShrink: 0 }}
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-medium small">{label}</div>
                                                <div className="text-muted small">
                                                    {value} ({pct}%)
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default ChartAnalysis;
