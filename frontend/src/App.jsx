"use client"
import React, { useState, useRef, Suspense, lazy } from "react"
import { Card, Table, Row, Col } from "react-bootstrap"
import { Toast } from "primereact/toast"
import { motion } from "framer-motion"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "primereact/resources/themes/lara-light-indigo/theme.css"
import "primereact/resources/primereact.min.css"
import sewingMachineGif from './img/leather.gif';
import "./App.css"
import PropTypes from 'prop-types';
import { ReactComponent as TailorSvg } from './img/tailorMan.svg';


// Lazy-loaded components
const Dashboard = lazy(() => import("./components/Dashboard"))
// const OrderForm = lazy(() => import("./components/OrderForm"))
// const OrderList = lazy(() => import("./components/OrderList"))
// const TaskList = lazy(() => import("./components/TaskList"))

const OrderForm = lazy(() => import("./components/order/createOrder"))
const OrderList = lazy(() => import("./components/task/OrderList"))
const TaskList = lazy(() => import("./components/updateTask/TaskList"))
const InventoryOverview = lazy(() => import("./components/InventoryOverview"))

console.log = () => { };

// Template Placeholder Components for Navigation Sections
const DashboardPlaceholder = () => (
  <div className="p-4">
    <div className="placeholder-glow mb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="placeholder" style={{ width: '300px', height: '32px', marginBottom: '8px' }}></div>
          <div className="placeholder" style={{ width: '400px', height: '16px' }}></div>
        </div>
        <div className="d-flex gap-2">
          <div className="placeholder" style={{ width: '120px', height: '38px' }}></div>
          <div className="placeholder" style={{ width: '120px', height: '38px' }}></div>
        </div>
      </div>
    </div>

    {/* KPI Cards Placeholder */}
    <Row className="g-3 mb-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Col key={i} xs={6} sm={4} lg={2}>
          <Card className="shadow-sm border-0 placeholder-glow">
            <Card.Body className="text-center">
              <div className="placeholder" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 12px' }}></div>
              <div className="placeholder" style={{ width: '80px', height: '32px', margin: '0 auto 8px' }}></div>
              <div className="placeholder" style={{ width: '60px', height: '16px', margin: '0 auto' }}></div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>

    {/* Charts Placeholder */}
    <Row className="g-4">
      <Col md={6}>
        <Card className="shadow-sm border-0 placeholder-glow">
          <Card.Body>
            <div className="placeholder" style={{ width: '60%', height: '24px', marginBottom: '16px' }}></div>
            <div className="placeholder" style={{ width: '100%', height: '300px' }}></div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6}>
        <Card className="shadow-sm border-0 placeholder-glow">
          <Card.Body>
            <div className="placeholder" style={{ width: '60%', height: '24px', marginBottom: '16px' }}></div>
            <div className="placeholder" style={{ width: '100%', height: '300px' }}></div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
)

const OrdersPlaceholder = () => (
  <div className="p-4">
    <div className="d-flex justify-content-between align-items-center mb-4 placeholder-glow">
      <div>
        <div className="placeholder" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
        <div className="placeholder" style={{ width: '300px', height: '16px' }}></div>
      </div>
      <div className="d-flex gap-2">
        <div className="placeholder" style={{ width: '100px', height: '38px' }}></div>
        <div className="placeholder" style={{ width: '100px', height: '38px' }}></div>
      </div>
    </div>

    <Card className="shadow-sm border-0">
      <Card.Body className="p-0">
        <Table responsive className="align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <tr key={i} className="placeholder-glow">
                <td><div className="placeholder" style={{ width: '80px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '120px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '90px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '70px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '60px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '100px', height: '20px' }}></div></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  </div>
)

const TasksPlaceholder = () => (
  <div className="p-4">
    <div className="d-flex justify-content-between align-items-center mb-4 placeholder-glow">
      <div>
        <div className="placeholder" style={{ width: '180px', height: '32px', marginBottom: '8px' }}></div>
        <div className="placeholder" style={{ width: '280px', height: '16px' }}></div>
      </div>
      <div className="d-flex gap-2">
        <div className="placeholder" style={{ width: '120px', height: '38px' }}></div>
      </div>
    </div>

    <Row className="g-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Col key={i} md={6} lg={4}>
          <Card className="shadow-sm border-0 placeholder-glow">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="placeholder" style={{ width: '60%', height: '20px' }}></div>
                <div className="placeholder" style={{ width: '70px', height: '24px' }}></div>
              </div>
              <div className="placeholder mb-2" style={{ width: '100%', height: '14px' }}></div>
              <div className="placeholder mb-3" style={{ width: '80%', height: '14px' }}></div>
              <div className="d-flex justify-content-between">
                <div className="placeholder" style={{ width: '80px', height: '14px' }}></div>
                <div className="placeholder" style={{ width: '90px', height: '32px' }}></div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </div>
)

const CreateOrderPlaceholder = () => (
  <div className="p-4">
    <div className="placeholder-glow mb-4">
      <div className="placeholder" style={{ width: '250px', height: '32px', marginBottom: '8px' }}></div>
      <div className="placeholder" style={{ width: '350px', height: '16px' }}></div>
    </div>

    <Card className="shadow-sm border-0">
      <Card.Header className="placeholder-glow">
        <div className="placeholder" style={{ width: '180px', height: '20px' }}></div>
      </Card.Header>
      <Card.Body>
        <Row className="g-4">
          <Col md={6}>
            <div className="placeholder-glow">
              <div className="placeholder mb-2" style={{ width: '120px', height: '16px' }}></div>
              <div className="placeholder mb-3" style={{ width: '100%', height: '38px' }}></div>

              <div className="placeholder mb-2" style={{ width: '100px', height: '16px' }}></div>
              <div className="placeholder mb-3" style={{ width: '100%', height: '38px' }}></div>

              <div className="placeholder mb-2" style={{ width: '80px', height: '16px' }}></div>
              <div className="placeholder mb-3" style={{ width: '100%', height: '38px' }}></div>
            </div>
          </Col>
          <Col md={6}>
            <div className="placeholder-glow">
              <div className="placeholder mb-2" style={{ width: '100px', height: '16px' }}></div>
              <div className="placeholder mb-3" style={{ width: '100%', height: '38px' }}></div>

              <div className="placeholder mb-2" style={{ width: '90px', height: '16px' }}></div>
              <div className="placeholder mb-3" style={{ width: '100%', height: '38px' }}></div>

              <div className="placeholder mb-2" style={{ width: '110px', height: '16px' }}></div>
              <div className="placeholder mb-3" style={{ width: '100%', height: '100px' }}></div>
            </div>
          </Col>
        </Row>
        <div className="d-flex gap-2 mt-4 placeholder-glow">
          <div className="placeholder" style={{ width: '100px', height: '38px' }}></div>
          <div className="placeholder" style={{ width: '80px', height: '38px' }}></div>
        </div>
      </Card.Body>
    </Card>
  </div>
)

const InventoryPlaceholder = () => (
  <div className="p-4">
    <div className="d-flex justify-content-between align-items-center mb-4 placeholder-glow">
      <div>
        <div className="placeholder" style={{ width: '220px', height: '32px', marginBottom: '8px' }}></div>
        <div className="placeholder" style={{ width: '320px', height: '16px' }}></div>
      </div>
      <div className="d-flex gap-2">
        <div className="placeholder" style={{ width: '100px', height: '38px' }}></div>
        <div className="placeholder" style={{ width: '120px', height: '38px' }}></div>
      </div>
    </div>

    {/* Inventory Summary Cards */}
    <Row className="g-3 mb-4">
      {[1, 2, 3, 4].map(i => (
        <Col key={i} md={3}>
          <Card className="shadow-sm border-0 placeholder-glow">
            <Card.Body className="text-center">
              <div className="placeholder" style={{ width: '50px', height: '50px', borderRadius: '50%', margin: '0 auto 12px' }}></div>
              <div className="placeholder" style={{ width: '100px', height: '32px', margin: '0 auto 8px' }}></div>
              <div className="placeholder" style={{ width: '80px', height: '16px', margin: '0 auto' }}></div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>

    {/* Inventory Table */}
    <Card className="shadow-sm border-0">
      <Card.Body className="p-0">
        <Table responsive className="align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <tr key={i} className="placeholder-glow">
                <td><div className="placeholder" style={{ width: '120px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '80px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '60px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '70px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '100px', height: '20px' }}></div></td>
                <td><div className="placeholder" style={{ width: '90px', height: '20px' }}></div></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  </div>
)

// Smart placeholder component based on active tab
const NavigationPlaceholder = ({ activeTab }) => {
  const placeholders = {
    dashboard: <DashboardPlaceholder />,
    create: <CreateOrderPlaceholder />,
    orders: <OrdersPlaceholder />,
    tasks: <TasksPlaceholder />,
    inventory: <InventoryPlaceholder />
  }

  return placeholders[activeTab] || <DashboardPlaceholder />
}

// Add prop validation for NavigationPlaceholder
NavigationPlaceholder.propTypes = {
  activeTab: PropTypes.string.isRequired,
};

function App() {
  // Initialize active tab from localStorage or URL hash, fallback to "dashboard"
  const getInitialTab = () => {
    // Check URL hash first
    const hash = window.location.hash.replace('#', '')
    if (hash && ['dashboard', 'create', 'orders', 'tasks', 'inventory'].includes(hash)) {
      return hash
    }
    // Check localStorage second
    const savedTab = localStorage.getItem('app_activeTab')
    if (savedTab && ['dashboard', 'create', 'orders', 'tasks', 'inventory'].includes(savedTab)) {
      return savedTab
    }
    return "dashboard"
  }

  const [activeTab, setActiveTab] = useState(getInitialTab)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const toast = useRef(null)

  // Simplified handleTabChange to ensure proper navigation
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return; // Prevent redundant navigation

    setActiveTab(newTab);
    localStorage.setItem('app_activeTab', newTab);
    window.history.replaceState(null, null, `#${newTab}`);
  };

  // Listen for browser back/forward navigation
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'create', 'orders', 'tasks', 'inventory'].includes(hash)) {
        if (hash !== activeTab) {
          setActiveTab(hash);
          localStorage.setItem('app_activeTab', hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeTab])

  // Effect to handle theme changes
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <motion.div
      className="min-h-screen mainPage"
      data-theme={theme}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} position="top-right" className="toastPopUp" />

      <motion.header
        className="sticky-top d-flex align-items-center border-bottom px-4 py-3 header-premium"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderBottomColor: 'var(--border-color)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          borderBottom: '1px solid var(--glass-border)'
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="d-flex align-items-center gap-3 fw-semibold"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* <motion.img
            src={sewingMachineGif}
            alt="Sewing Machine"
            style={{
              height: "35px",
              width: "35px",
              objectFit: 'contain',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))'
            }}
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          /> */}
          {/* SVG Icon Wrapper */}
          <motion.div
            style={{
              height: "50px",
              width: "50px",
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))',
              position: 'relative',
              zIndex: 10,
              objectFit: 'contain',
            }}
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="tailor-svg-logo"
          >
            <TailorSvg />
          </motion.div>
          <motion.span
            className="text-primary fw-bold brand-text"
            style={{
              fontSize: "1.5rem",
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            SIDHU Textiles
          </motion.span>
        </motion.div>
        <div className="ms-auto me-3">
          <motion.button
            className="btn theme-toggle-premium"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '14px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'var(--nav-hover-bg)'
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              backgroundColor: 'var(--nav-hover-bg)'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <motion.i
              className={`bi bi-${theme === 'light' ? 'moon' : 'sun'}`}
              style={{ fontSize: '1.1rem' }}
              initial={false}
              animate={{ rotate: theme === 'light' ? 0 : 180 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
            />
          </motion.button>
        </div>
        {/* <div className="position-relative ms-auto flex-grow-0 me-3">
          <i className="bi bi-search position-absolute" style={{ left: "10px", top: "10px", fontSize: "0.9rem" }}></i>
          <input
            type="search"
            placeholder="Search..."
            className="form-control"
            style={{ paddingLeft: "30px", width: "300px" }}
          />
        </div>
        <div className="dropdown">
          <button
            className="btn btn-outline-secondary rounded-circle position-relative"
            type="button"
            data-bs-toggle="dropdown"
          >
            <i className="bi bi-bell"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">3</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <span className="dropdown-item-text fw-bold">Notifications</span>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <a className="dropdown-item" href="#">
                New order received (#1234)
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Low stock alert: Cotton Fabric
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Task deadline approaching: Order #1230
              </a>
            </li>
          </ul>
        </div>
        <div className="dropdown ms-2">
          <button className="btn btn-outline-secondary rounded-circle" type="button" data-bs-toggle="dropdown">
            <i className="bi bi-person"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <span className="dropdown-item-text fw-bold">My Account</span>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Profile
              </a>
            </li>
            <li>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Profile
              </a>
            </li>
            <li>
            <li>
              <a className="dropdown-item" href="#">
                Settings
              </a>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Logout
              </a>
            </li>
          </ul>
        </div> */}
      </motion.header>

      <div className="d-flex pageBody">
        <motion.nav
          className="d-none d-md-block border-end sidebar-nav-premium"
          style={{
            width: "240px",
            backgroundColor: 'var(--nav-bg)',
            borderRightColor: 'var(--border-color)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'var(--glass-bg)',
            borderRight: '1px solid var(--glass-border)'
          }}
          initial={{ x: -240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        >
          <div className="d-flex flex-column gap-2 p-3">
            {[
              { key: "dashboard", icon: "house", label: "Dashboard" },
              { key: "create", icon: "plus-circle", label: "Create Order" },
              { key: "orders", icon: "cart", label: "Orders" },
              { key: "tasks", icon: "clock", label: "Tasks" },
              { key: "inventory", icon: "box", label: "Inventory" }
            ].map((item, index) => (
              <motion.button
                key={item.key}
                className={`btn text-start nav-item-premium ${activeTab === item.key ? "btn-light fw-medium" : "btn-white"}`}
                onClick={() => handleTabChange(item.key)}
                style={{
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === item.key
                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))'
                    : 'var(--glass-bg)',
                  color: activeTab === item.key ? '#ffffff' : 'var(--text-primary)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: '4px',
                  boxShadow: activeTab === item.key
                    ? '0 4px 12px rgba(0,123,255,0.3)'
                    : '0 2px 4px rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(8px)',
                  opacity: 1,
                  cursor: 'pointer'
                }}
                whileHover={{
                  scale: 1.01,
                  x: 2
                }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.2,
                  delay: 0.2 + (index * 0.05),
                  type: "tween"
                }}
              >
                <motion.i
                  className={`bi bi-${item.icon} me-3`}
                  style={{ fontSize: '1.1rem' }}
                  transition={{ duration: 0.1 }}
                />
                {item.label}
              </motion.button>
            ))}
          </div>
        </motion.nav>

        <motion.main
          className="flex-grow-1 main-content-premium"
          style={{
            overflow: "auto",
            background: 'linear-gradient(135deg, var(--bg-app) 0%, var(--bg-secondary) 100%)',
            position: 'relative'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Suspense
            fallback={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationPlaceholder activeTab={activeTab} />
              </motion.div>
            }
          >
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} toast={toast} />}
              {activeTab === "create" && <OrderForm toast={toast} setActiveTab={setActiveTab} />}
              {activeTab === "orders" && <OrderList toast={toast} setActiveTab={setActiveTab} />}
              {activeTab === "tasks" && <TaskList toast={toast} />}
              {activeTab === "inventory" && <InventoryOverview toast={toast} />}
            </motion.div>
          </Suspense>
        </motion.main>
      </div>
    </motion.div>
  )
}

export default App

