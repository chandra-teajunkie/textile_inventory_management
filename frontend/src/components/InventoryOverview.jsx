"use client"

import { useState, useEffect } from "react"
import { Card, Button, Badge, Form, Dropdown, Modal, ProgressBar, Row, Col } from "react-bootstrap"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

function InventoryOverview({ toast }) {
  const [inventory, setInventory] = useState([])
  const INVENTORY_API_BASE = process.env.REACT_APP_INVENTORY

  // Load inventory from backend on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const res = await fetch(INVENTORY_API_BASE)
        if (!res.ok) throw new Error(`Failed to load inventory: ${res.status}`)
        const data = await res.json()
        // Map backend fields (inventory_id) to id to keep the UI consistent
        const mapped = data.map(item => ({
          id: item.inventory_id || item.id,
          name: item.name,
          category: item.category,
          inStock: item.in_stock ?? item.inStock ?? 0,
          unit: item.unit || "pcs",
          minStock: item.min_stock ?? item.minStock ?? 0,
          maxStock: item.max_stock ?? item.maxStock ?? 100,
          reorderPoint: item.reorder_point ?? item.reorderPoint ?? 0,
          location: item.location || "",
          lastUpdated: item.last_updated || item.lastUpdated || new Date().toISOString().split("T")[0],
        }))
        setInventory(mapped)
      } catch (err) {
        console.warn("Inventory load failed, using local sample data", err)
        // leave inventory empty or you could fallback to sample data here
      }
    }
    loadInventory()
  }, [])

  const [filterCategory, setFilterCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Fabric",
    inStock: 0,
    unit: "yards",
    minStock: 0,
    maxStock: 100,
    reorderPoint: 25,
    location: "",
  })

  const getStockStatus = (item) => {
    if (item.inStock <= item.minStock) {
      return { status: "Low Stock", color: "danger" }
    } else if (item.inStock <= item.reorderPoint) {
      return { status: "Reorder Soon", color: "warning" }
    } else if (item.inStock >= item.maxStock) {
      return { status: "Overstocked", color: "info" }
    } else {
      return { status: "In Stock", color: "success" }
    }
  }

  const getStockPercentage = (item) => {
    return Math.min(Math.round((item.inStock / item.maxStock) * 100), 100)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleAddItem = () => {
    // Validate form
    if (!newItem.name || !newItem.category || !newItem.location) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please fill all required fields",
        life: 3000,
      })
      return
    }

    const create = async () => {
      const payload = {
        name: newItem.name,
        category: newItem.category,
        in_stock: newItem.inStock,
        unit: newItem.unit,
        min_stock: newItem.minStock,
        max_stock: newItem.maxStock,
        reorder_point: newItem.reorderPoint,
        location: newItem.location,
      }

      try {
        const res = await fetch(INVENTORY_API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error(`Create failed: ${res.status}`)

        const created = await res.json()
        const mapped = {
          id: created.inventory_id || created.id,
          name: created.name,
          category: created.category,
          inStock: created.in_stock ?? created.inStock ?? newItem.inStock,
          unit: created.unit || newItem.unit,
          minStock: created.min_stock ?? created.minStock ?? newItem.minStock,
          maxStock: created.max_stock ?? created.maxStock ?? newItem.maxStock,
          reorderPoint: created.reorder_point ?? created.reorderPoint ?? newItem.reorderPoint,
          location: created.location || newItem.location,
          lastUpdated: created.last_updated || created.lastUpdated || new Date().toISOString().split("T")[0],
        }

        setInventory((prev) => [mapped, ...prev])
      } catch (err) {
        console.warn("Create inventory failed, creating locally", err)
        const newId = `INV-${String(inventory.length + 1).padStart(3, "0")}`
        const itemToAdd = {
          ...newItem,
          id: newId,
          lastUpdated: new Date().toISOString().split("T")[0],
        }
        setInventory((prev) => [...prev, itemToAdd])
      } finally {
        setNewItem({
          name: "",
          category: "Fabric",
          inStock: 0,
          unit: "yards",
          minStock: 0,
          maxStock: 100,
          reorderPoint: 25,
          location: "",
        })
        setShowAddModal(false)
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Inventory item added successfully",
          life: 3000,
        })
      }
    }

    create()
  }

  const handleUpdateItem = () => {
    if (!selectedItem) return

    const update = async () => {
      try {
        const payload = {
          name: selectedItem.name,
          category: selectedItem.category,
          in_stock: selectedItem.inStock,
          unit: selectedItem.unit,
          min_stock: selectedItem.minStock,
          max_stock: selectedItem.maxStock,
          reorder_point: selectedItem.reorderPoint,
          location: selectedItem.location,
        }

        const res = await fetch(`${INVENTORY_API_BASE}${selectedItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error(`Update failed: ${res.status}`)

        const updated = await res.json()
        const mapped = {
          id: updated.inventory_id || updated.id || selectedItem.id,
          name: updated.name || selectedItem.name,
          category: updated.category || selectedItem.category,
          inStock: updated.in_stock ?? updated.inStock ?? selectedItem.inStock,
          unit: updated.unit || selectedItem.unit,
          minStock: updated.min_stock ?? updated.minStock ?? selectedItem.minStock,
          maxStock: updated.max_stock ?? updated.maxStock ?? selectedItem.maxStock,
          reorderPoint: updated.reorder_point ?? updated.reorderPoint ?? selectedItem.reorderPoint,
          location: updated.location || selectedItem.location,
          lastUpdated: updated.last_updated || updated.lastUpdated || new Date().toISOString().split("T")[0],
        }

        setInventory((prev) => prev.map((i) => (i.id === selectedItem.id ? mapped : i)))
      } catch (err) {
        console.warn("Update failed, applying locally", err)
        setInventory((prev) => prev.map((i) => (i.id === selectedItem.id ? { ...selectedItem, lastUpdated: new Date().toISOString().split("T")[0] } : i)))
      } finally {
        setShowUpdateModal(false)
        setSelectedItem(null)
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Inventory item updated successfully",
          life: 3000,
        })
      }
    }

    update()
  }

  const handleDeleteItem = (id) => {
    const remove = async () => {
      try {
        const res = await fetch(`${INVENTORY_API_BASE}${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
        setInventory((prev) => prev.filter((i) => i.id !== id))
      } catch (err) {
        console.warn("Delete failed, removing locally", err)
        setInventory((prev) => prev.filter((i) => i.id !== id))
      }
    }

    remove()
  }

  const handleEditItem = (item) => {
    setSelectedItem({ ...item })
    setShowUpdateModal(true)
  }

  const exportInventory = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(inventory)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Save file
    saveAs(data, "inventory.xlsx")

    toast.current.show({
      severity: "success",
      summary: "Export Complete",
      detail: "Inventory exported to Excel",
      life: 3000,
    })
  }

  const filteredInventory = inventory
    .filter((item) => filterCategory === "all" || item.category === filterCategory)
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">Inventory Management</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={exportInventory}>
            <i className="bi bi-download me-2"></i>
            Export
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus me-2"></i>
            Add New Item
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="btn-group">
              <Button
                variant={filterCategory === "all" ? "primary" : "outline-primary"}
                onClick={() => setFilterCategory("all")}
              >
                All Items
              </Button>
              <Button
                variant={filterCategory === "Fabric" ? "primary" : "outline-primary"}
                onClick={() => setFilterCategory("Fabric")}
              >
                Fabrics
              </Button>
              <Button
                variant={filterCategory === "Accessories" ? "primary" : "outline-primary"}
                onClick={() => setFilterCategory("Accessories")}
              >
                Accessories
              </Button>
              <Button
                variant={filterCategory === "Tools" ? "primary" : "outline-primary"}
                onClick={() => setFilterCategory("Tools")}
              >
                Tools
              </Button>
              <Button
                variant={filterCategory === "Other" ? "primary" : "outline-primary"}
                onClick={() => setFilterCategory("Other")}
              >
                Other
              </Button>
            </div>
            <div className="d-flex align-items-center">
              <div className="position-relative">
                <i className="bi bi-search position-absolute" style={{ left: "10px", top: "10px" }}></i>
                <Form.Control
                  type="search"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="ps-4"
                  style={{ width: "250px" }}
                />
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div
          // className="table-responsive"
          >
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Status</th>
                  <th>Stock Level</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const stockPercentage = getStockPercentage(item)

                  return (
                    <tr key={item.id}>
                      <td className="fw-medium">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>
                        {item.inStock} {item.unit}
                      </td>
                      <td>
                        <Badge bg={stockStatus.color}>{stockStatus.status}</Badge>
                      </td>
                      <td style={{ width: "20%" }}>
                        <ProgressBar
                          now={stockPercentage}
                          variant={stockStatus.color}
                          label={`${stockPercentage}%`}
                          style={{ height: "10px" }}
                        />
                      </td>
                      <td className="text-end">
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${item.id}`}>
                            <i className="bi bi-three-dots"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleEditItem(item)}>Edit Item</Dropdown.Item>
                            {/* <Dropdown.Item href="#">View Details</Dropdown.Item> */}
                            <Dropdown.Divider />
                            {/* <Dropdown.Item href="#">Reorder</Dropdown.Item> */}
                            <Dropdown.Item className="text-danger" onClick={() => {
                              if (window.confirm('Are you sure you want to delete this item?')) {
                                handleDeleteItem(item.id)
                              }
                            }}>Delete Item</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Add Item Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Inventory Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                required
              >
                <option value="Fabric">Fabric</option>
                <option value="Accessories">Accessories</option>
                <option value="Tools">Tools</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Initial Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={newItem.inStock}
                    onChange={(e) => setNewItem({ ...newItem, inStock: Number.parseInt(e.target.value) || 0 })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Unit</Form.Label>
                  <Form.Select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>
                    <option value="yards">yards</option>
                    <option value="meters">meters</option>
                    <option value="pcs">pcs</option>
                    <option value="spools">spools</option>
                    <option value="kg">kg</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Min Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number.parseInt(e.target.value) || 0 })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Max Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={newItem.maxStock}
                    onChange={(e) => setNewItem({ ...newItem, maxStock: Number.parseInt(e.target.value) || 0 })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Reorder Point</Form.Label>
                  <Form.Control
                    type="number"
                    value={newItem.reorderPoint}
                    onChange={(e) => setNewItem({ ...newItem, reorderPoint: Number.parseInt(e.target.value) || 0 })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Location <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                placeholder="Warehouse A, Shelf 1"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddItem}>
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Item Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Inventory Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Item ID</Form.Label>
                <Form.Control type="text" value={selectedItem.id} disabled />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Item Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedItem.name}
                  onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={selectedItem.category}
                  onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                  required
                >
                  <option value="Fabric">Fabric</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Tools">Tools</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Current Stock <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedItem.inStock}
                      onChange={(e) => setSelectedItem({ ...selectedItem, inStock: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={selectedItem.unit}
                      onChange={(e) => setSelectedItem({ ...selectedItem, unit: e.target.value })}
                      required
                    >
                      <option value="yards">yards</option>
                      <option value="meters">meters</option>
                      <option value="pcs">pcs</option>
                      <option value="spools">spools</option>
                      <option value="kg">kg</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Min Stock <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedItem.minStock}
                      onChange={(e) => setSelectedItem({ ...selectedItem, minStock: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Max Stock <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedItem.maxStock}
                      onChange={(e) => setSelectedItem({ ...selectedItem, maxStock: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Reorder Point <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedItem.reorderPoint}
                      onChange={(e) => setSelectedItem({ ...selectedItem, reorderPoint: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={selectedItem.location}
                  onChange={(e) => setSelectedItem({ ...selectedItem, location: e.target.value })}
                  required
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateItem}>
            Update Item
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default InventoryOverview

