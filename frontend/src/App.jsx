"use client"
import React from "react";
import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { Toast } from "primereact/toast"
import { useRef, Suspense, lazy } from "react"
import "./App.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "primereact/resources/themes/lara-light-indigo/theme.css"
import "primereact/resources/primereact.min.css"
import TextileLogo from './img/tailor.png';
import { GiSewingMachine } from "react-icons/gi";

// Lazy-loaded components
const Dashboard = lazy(() => import("./components/Dashboard"))
const OrderForm = lazy(() => import("./components/OrderForm"))
const OrderList = lazy(() => import("./components/OrderList"))
const TaskList = lazy(() => import("./components/TaskList"))
const InventoryOverview = lazy(() => import("./components/InventoryOverview"))

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const toast = useRef(null)

  return (
    <div className="min-h-screen bg-light mainPage">
      <Toast ref={toast} position="top-right" className="toastPopUp" />

      <header className="sticky-top d-flex align-items-center border-bottom bg-white px-4 py-3 shadow-sm">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          {/* <i className="bi bi-scissors text-primary fs-4"></i> */}
          {/* <img src={TextileLogo}></img> */}
          <GiSewingMachine className="text-primary fs-4" style={{ height: "35px", width: "35px" }} />
          <span className="text-primary fw-bold" style={{ fontSize: "1.5rem" }}>Manda Garments</span>
        </div>
        <div className="position-relative ms-auto flex-grow-0 me-3">
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
        </div>
      </header>

      <div className="d-flex pageBody">
        <nav className="d-none d-md-block border-end bg-white" style={{ width: "240px" }}>
          <div className="d-flex flex-column gap-2 p-3">
            <button
              className={`btn text-start ${activeTab === "dashboard" ? "btn-light fw-medium" : "btn-white"}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <i className="bi bi-house me-2"></i>
              Dashboard
            </button>
            <button
              className={`btn text-start ${activeTab === "create" ? "btn-light fw-medium" : "btn-white"}`}
              onClick={() => setActiveTab("create")}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Order
            </button>
            <button
              className={`btn text-start ${activeTab === "orders" ? "btn-light fw-medium" : "btn-white"}`}
              onClick={() => setActiveTab("orders")}
            >
              <i className="bi bi-cart me-2"></i>
              Orders
            </button>
            <button
              className={`btn text-start ${activeTab === "tasks" ? "btn-light fw-medium" : "btn-white"}`}
              onClick={() => setActiveTab("tasks")}
            >
              <i className="bi bi-clock me-2"></i>
              Tasks
            </button>
            <button
              className={`btn text-start ${activeTab === "inventory" ? "btn-light fw-medium" : "btn-white"}`}
              onClick={() => setActiveTab("inventory")}
            >
              <i className="bi bi-box me-2"></i>
              Inventory
            </button>
            {/* <button className="btn text-start btn-white">
              <i className="bi bi-scissors me-2"></i>
              Products
            </button>
            <button className="btn text-start btn-white">
              <i className="bi bi-file-text me-2"></i>
              Size Charts
            </button>
            <button className="btn text-start btn-white">
              <i className="bi bi-people me-2"></i>
              Customers
            </button>
            <button className="btn text-start btn-white">
              <i className="bi bi-bar-chart me-2"></i>
              Reports
            </button>
            <button className="btn text-start btn-white">
              <i className="bi bi-gear me-2"></i>
              Settings
            </button> */}
          </div>
        </nav>

        <main className="flex-grow-1 p-4" style={{ overflow: "auto" }}>
          <Suspense
            fallback={
              <div className="text-center p-5">
                <Spinner animation="border" />
              </div>
            }
          >
            {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} toast={toast} />}
            {activeTab === "create" && <OrderForm toast={toast} setActiveTab={setActiveTab} />}
            {activeTab === "orders" && <OrderList toast={toast} setActiveTab={setActiveTab} />}
            {activeTab === "tasks" && <TaskList toast={toast} />}
            {activeTab === "inventory" && <InventoryOverview toast={toast} />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default App

