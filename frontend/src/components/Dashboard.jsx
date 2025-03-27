"use client"

import { useState, useEffect } from "react"
import { Card, Button, Row, Col, Tabs, Tab } from "react-bootstrap"
import { RecentOrders } from "./RecentOrders"
import { TasksList } from "./TasksList"

function Dashboard({ setActiveTab, toast }) {
  const [orders, setOrders] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const res = await fetch(process.env.REACT_APP_GET_ALL_ORDERS);
      const data = await res.json();
      const sortedOrders = data.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
      setOrders(sortedOrders);
      // console.log(sortedOrders)

    } catch (err) {
      console.error('Failed to fetch orders', err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch orders",
        life: 3000,
      })
    }
  };



  useEffect(() => {
    if (orders.length > 0) {
      const fetchTasksForOrders = async () => {
        try {
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
          const allTasks = [];

          for (const order of orders) {
            const res = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${order.order_id}`);
            const data = await res.json();
            const orderDueDate = new Date(order.due_date);
            if (orderDueDate <= oneWeekFromNow) {
              allTasks.push(...data.map(task => ({ ...task, due_date: order.due_date })));
            }
          }

          setTasks(allTasks);
          // console.log(allTasks, orders)
        } catch (err) {
          console.error('Failed to fetch tasks', err);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to fetch tasks",
            life: 3000,
          })
        }
      }
      fetchTasksForOrders()
    }
  }, [orders]);


  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // // Fetch orders
        // const ordersResponse = await fetch(process.env.REACT_APP_GET_ALL_ORDERS)
        // const ordersData = await ordersResponse.json()
        // setOrders(ordersData)

        // // Fetch tasks (using a sample order ID for dashboard)
        // if (ordersData.length > 0) {
        //   const tasksResponse = await fetch(`${process.env.REACT_APP_GET_ALL_TASKS}${ordersData[0].order_id}`)
        //   const tasksData = await tasksResponse.json()
        //   setTasks(tasksData)
        // }

        fetchOrders();
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load dashboard data",
          life: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">Dashboard</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-primary">Download Report</Button>
          <Button variant="primary" onClick={() => setActiveTab("create")}>
            <i className="bi bi-plus me-2"></i>
            New Order
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <div className="text-muted small">Total Revenue</div>
                <i className="bi bi-currency-dollar text-primary"></i>
              </div>
              <div className="h3 fw-bold">$45,231.89</div>
              <div className="small text-success">
                <i className="bi bi-arrow-up"></i> 20.1% from last month
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <div className="text-muted small">Pending Orders</div>
                <i className="bi bi-cart text-primary"></i>
              </div>
              <div className="h3 fw-bold">12</div>
              <div className="small text-danger">
                <i className="bi bi-arrow-down"></i> 4% from last week
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <div className="text-muted small">Inventory Items</div>
                <i className="bi bi-box text-primary"></i>
              </div>
              <div className="h3 fw-bold">573</div>
              <div className="small text-success">
                <i className="bi bi-plus"></i> 12 new items added
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <div className="text-muted small">Active Tasks</div>
                <i className="bi bi-clock text-primary"></i>
              </div>
              <div className="h3 fw-bold">24</div>
              <div className="small text-warning">8 tasks due today</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <div className="text-muted small">Total Orders</div>
                <i className="bi bi-currency-dollar text-primary"></i>
              </div>
              <div className="h3 fw-bold">{orders?.length || 0}</div>
              <div className="small text-success">
                <i className="bi bi-arrow-up"></i> 10% from last month
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <div className="text-muted small">Total Tasks</div>
                <i className="bi bi-cart text-primary"></i>
              </div>
              <div className="h3 fw-bold">{tasks?.length || 0}</div>
              <div className="small text-danger">
                <i className="bi bi-arrow-down"></i> 2% from last week
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" className="mb-4">
        <Tab eventKey="overview" title="Overview">
          <Row className="g-4">
            <Col lg={7}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                  <Card.Title>Recent Orders</Card.Title>
                </Card.Header>
                <Card.Body>
                  <RecentOrders orders={orders} toast={toast} />
                </Card.Body>
                <Card.Footer className="bg-white border-0">
                  <Button variant="link" className="text-decoration-none p-0" onClick={() => setActiveTab("orders")}>
                    View all orders <i className="bi bi-arrow-up-right"></i>
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                  <Card.Title>Upcoming Tasks</Card.Title>
                  <Card.Subtitle className="text-muted">Tasks due in the next 7 days</Card.Subtitle>
                </Card.Header>
                <Card.Body>
                  <TasksList tasks={tasks} toast={toast} />
                </Card.Body>
                <Card.Footer className="bg-white border-0">
                  <Button variant="link" className="text-decoration-none p-0" onClick={() => setActiveTab("tasks")}>
                    View all tasks <i className="bi bi-arrow-up-right"></i>
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  )
}

export default Dashboard

