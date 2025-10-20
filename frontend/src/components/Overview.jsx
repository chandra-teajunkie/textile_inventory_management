"use client"

import { useState, useEffect, useRef } from "react"
import { Card, Button, Table, Dropdown, ProgressBar, Badge, Row, Col, Form } from "react-bootstrap"
import { FaFileExport, FaPrint, FaFilter, FaSearch } from "react-icons/fa"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'

export function ConsolidatedView({ orders, tasks, toast }) {
    const [filteredTasks, setFilteredTasks] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateRange, setDateRange] = useState({
        start: "",
        end: ""
    })

    // Initialize with all data
    useEffect(() => {
        setFilteredTasks(tasks)
        setFilteredOrders(orders)
    }, [tasks, orders])

    // Apply filters
    const applyFilters = () => {
        let filteredTasksResult = [...tasks]
        let filteredOrdersResult = [...orders]

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();

            filteredTasksResult = filteredTasksResult.filter(task =>
                task.name.toLowerCase().includes(term) ||
                (task.task_id || "").toLowerCase().includes(term)
            );

            filteredOrdersResult = filteredOrdersResult.filter(order =>
                order.customer_name.toLowerCase().includes(term) ||
                order.order_id.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filteredTasksResult = filteredTasksResult.filter(task => task.status === statusFilter)
            filteredOrdersResult = filteredOrdersResult.filter(order => order.status === statusFilter)
        }

        // Apply date range filter
        if (dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start)
            const endDate = new Date(dateRange.end)

            filteredTasksResult = filteredTasksResult.filter(task => {
                const taskDate = new Date(task.due_date || task.created_at)
                return taskDate >= startDate && taskDate <= endDate
            })

            filteredOrdersResult = filteredOrdersResult.filter(order => {
                const orderDate = new Date(order.order_date)
                return orderDate >= startDate && orderDate <= endDate
            })
        }

        setFilteredTasks(filteredTasksResult)
        setFilteredOrders(filteredOrdersResult)
    }

    // Export to CSV
    const exportToCSV = (type) => {
        const data = type === 'orders' ? filteredOrders : filteredTasks
        if (data.length === 0) {
            toast.current.show({
                severity: "warning",
                summary: "Export Failed",
                detail: `No ${type} to export`,
                life: 3000,
            })
            return
        }

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, `${type.charAt(0).toUpperCase() + type.slice(1)}`)
        XLSX.writeFile(workbook, `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`)
    }

    // Export to PDF
    const exportToPDF = (type) => {
        const data = type === 'orders' ? filteredOrders : filteredTasks
        if (data.length === 0) {
            toast.current.show({
                severity: "warning",
                summary: "Export Failed",
                detail: `No ${type} to export`,
                life: 3000,
            })
            return
        }

        const doc = new jsPDF()
        const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`

        // Add title
        doc.text(title, 14, 10)

        // Prepare data for table
        const headers = ((type === 'orders')
            ? ['Order ID', 'Customer', 'Type', 'Date', 'Status']
            : ['Task ID', 'Name', 'Status', 'Dependencies'])

        const body = data.map(item => {
            if (type === 'orders') {
                return [
                    item.order_id,
                    item.customer_name,
                    item.types,
                    new Date(item.order_date).toLocaleDateString(),
                    item.status
                ]
            } else {
                return [
                    item.task_id,
                    item.name,
                    item.status,
                    item.dependencies && item.dependencies !== "[]" ? "Yes" : "No"
                ]
            }
        })

        autoTable(doc, {
            head: [headers],
            body: body,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        })

        doc.save(`${type}_report_${new Date().toISOString().slice(0, 10)}.pdf`)
    }

    // Print view
    const handlePrint = (type) => {
        const data = type === 'orders' ? filteredOrders : filteredTasks
        if (data.length === 0) {
            toast.current.show({
                severity: "warning",
                summary: "Print Failed",
                detail: `No ${type} to print`,
                life: 3000,
            })
            return
        }

        // Define headers based on type
        const headers = type === 'orders'
            ? ['Order ID', 'Customer', 'Type', 'Date', 'Status']
            : ['Task ID', 'Name', 'Status', 'Dependencies']

        const printWindow = window.open('', '', 'width=1000,height=600')
        printWindow.document.write(`
      <html>
        <head>
          <title>${type.charAt(0).toUpperCase() + type.slice(1)} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .badge { padding: 3px 6px; border-radius: 3px; font-size: 12px; }
            .badge-warning { background-color: #ffc107; color: #000; }
            .badge-success { background-color: #28a745; color: #fff; }
            .badge-secondary { background-color: #6c757d; color: #fff; }
            .badge-danger { background-color: #dc3545; color: #fff; }
            .badge-primary { background-color: #007bff; color: #fff; }
          </style>
        </head>
        <body>
          <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => {
            return `
                  <tr>
                                            ${type === 'orders' ? `
                                            <td>${item.order_id}</td>
                                            <td>${item.customer_name}</td>
                                            <td>${item.types}</td>
                                            <td>${new Date(item.order_date).toLocaleDateString()}</td>
                                            <td><span class="badge badge-${getStatusColor(item.status).toLowerCase()}">${item.status}</span></td>
                                        ` : `
                                            <td>${item.task_id}</td>
                                            <td>${item.name}</td>
                                            <td><span class="badge badge-${getStatusColor(item.status).toLowerCase()}">${item.status}</span></td>
                                            <td>${item.dependencies && item.dependencies !== "[]" ? "Yes" : "No"}</td>
                                        `}
                  </tr>
                `
        }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `)
        printWindow.document.close()
    }

    // Status color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case "Processing":
            case "IN PROGRESS":
                return "warning"
            case "Shipped":
                return "primary"
            case "Delivered":
            case "COMPLETED":
                return "success"
            case "Pending":
            case "NOT STARTED":
                return "danger"
            default:
                return "secondary"
        }
    }

    return (
        <div className="p-4">
            {/* Filters Section */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search</Form.Label>
                                <div className="input-group">
                                    <Form.Control
                                        type="text"
                                        placeholder="Search orders or tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="outline-secondary" onClick={applyFilters}>
                                        <FaSearch />
                                    </Button>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Pending">Pending</option>
                                    <option value="IN PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="NOT STARTED">Not Started</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>From Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>To Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} className="text-end">
                            <Button variant="primary" onClick={applyFilters} className="me-2">
                                <FaFilter className="me-1" /> Apply Filters
                            </Button>
                            <Button variant="outline-secondary" onClick={() => {
                                setSearchTerm("")
                                setStatusFilter("all")
                                setDateRange({ start: "", end: "" })
                                setFilteredTasks(tasks)
                                setFilteredOrders(orders)
                            }}>
                                Clear Filters
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Orders Section */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                    <div>
                        <Card.Title>Orders Overview</Card.Title>
                        <Card.Subtitle className="text-muted">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </Card.Subtitle>
                    </div>
                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-orders-export">
                            <FaFileExport className="me-1" /> Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => exportToCSV('orders')}>CSV</Dropdown.Item>
                            <Dropdown.Item onClick={() => exportToPDF('orders')}>PDF</Dropdown.Item>
                            <Dropdown.Item onClick={() => handlePrint('orders')}>Print</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table hover>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Tasks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.order_id}>
                                        <td>{order.order_id}</td>
                                        <td>{order.customer_name}</td>
                                        <td>{order.types}</td>
                                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td>
                                            <Badge bg={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            {tasks.filter(t => t.order_id === order.order_id).length}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Tasks Section */}
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                    <div>
                        <Card.Title>Tasks Overview</Card.Title>
                        <Card.Subtitle className="text-muted">
                            Showing {filteredTasks.length} of {tasks.length} tasks
                        </Card.Subtitle>
                    </div>
                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-tasks-export">
                            <FaFileExport className="me-1" /> Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => exportToCSV('tasks')}>CSV</Dropdown.Item>
                            <Dropdown.Item onClick={() => exportToPDF('tasks')}>PDF</Dropdown.Item>
                            <Dropdown.Item onClick={() => handlePrint('tasks')}>Print</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table hover>
                            <thead>
                                <tr>
                                    <th>Task ID</th>
                                    <th>Name</th>
                                    <th>Related Order</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Dependencies</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.task_id}>
                                        <td>{task.task_id}</td>
                                        <td>{task.name}</td>
                                        <td>{task.order_id || 'N/A'}</td>
                                        <td>
                                            <Badge bg={getStatusColor(task.status)}>
                                                {task.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            <ProgressBar
                                                now={task.status === "NOT STARTED" ? 0 :
                                                    task.status === "IN PROGRESS" ? 50 : 100}
                                                variant={getStatusColor(task.status)}
                                                style={{ height: '6px' }}
                                            />
                                        </td>
                                        <td>
                                            {task.dependencies && task.dependencies !== "[]" ? (
                                                <Badge bg="info">Has Dependencies</Badge>
                                            ) : (
                                                <Badge bg="secondary">None</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    )
}