"use client"
import React from "react";
import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { Toast } from "primereact/toast"
import { useRef, Suspense, lazy } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "./App.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "primereact/resources/themes/lara-light-indigo/theme.css"
import "primereact/resources/primereact.min.css"
import TextileLogo from './img/tailor.png';
import { GiSewingMachine } from "react-icons/gi";
import sewingMachineGif from './img/leather.gif';

// Lazy-loaded components
const Dashboard = lazy(() => import("./components/Dashboard"))
// const OrderForm = lazy(() => import("./components/OrderForm"))
// const OrderList = lazy(() => import("./components/OrderList"))
// const TaskList = lazy(() => import("./components/TaskList"))

const OrderForm = lazy(() => import("./components/order/createOrder"))
const OrderList = lazy(() => import("./components/task/OrderList"))
const TaskList = lazy(() => import("./components/updateTask/TaskList"))
const InventoryOverview = lazy(() => import("./components/InventoryOverview"))

console.log = () => {};

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const toast = useRef(null)

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
      transition={{ duration: 0.5 }}
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
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="d-flex align-items-center gap-3 fw-semibold"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <motion.img
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
          />
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
              backdropFilter: 'blur(10px)'
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
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
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
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
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
                onClick={() => setActiveTab(item.key)}
                style={{
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === item.key 
                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))' 
                    : 'var(--glass-bg)',
                  color: activeTab === item.key ? '#ffffff' : 'var(--text-primary)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: '4px',
                  boxShadow: activeTab === item.key 
                    ? '0 4px 12px rgba(0,123,255,0.3)' 
                    : '0 2px 4px rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(8px)'
                }}
                whileHover={{ 
                  scale: 1.02,
                  x: 4,
                  boxShadow: activeTab === item.key 
                    ? '0 6px 20px rgba(0,123,255,0.4)' 
                    : '0 4px 12px rgba(0,0,0,0.1)'
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.4 + (index * 0.1),
                  type: "spring",
                  stiffness: 100
                }}
              >
                <motion.i 
                  className={`bi bi-${item.icon} me-3`}
                  style={{ fontSize: '1.1rem' }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
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
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Suspense
            fallback={
              <motion.div 
                className="text-center p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Spinner animation="border" style={{ color: 'var(--accent-primary)' }} />
                </motion.div>
                <motion.p 
                  className="mt-3 text-muted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Loading...
                </motion.p>
              </motion.div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
              >
                {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} toast={toast} />}
                {activeTab === "create" && <OrderForm toast={toast} setActiveTab={setActiveTab} />}
                {activeTab === "orders" && <OrderList toast={toast} setActiveTab={setActiveTab} />}
                {activeTab === "tasks" && <TaskList toast={toast} />}
                {activeTab === "inventory" && <InventoryOverview toast={toast} />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </motion.main>
      </div>
    </motion.div>
  )
}

export default App

