"use client"

import { useState } from "react"
import { Card, Button, Badge, Form, Dropdown, Modal, ProgressBar, Row, Col } from "react-bootstrap"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

function InventoryOverview({ toast }) {
  const [inventory, setInventory] = useState([
    {
      id: "INV-001",
      name: "Cotton Fabric - White",
      category: "Fabric",
      inStock: 120,
      unit: "yards",
      minStock: 50,
      maxStock: 200,
      reorderPoint: 75,
      location: "Warehouse A, Shelf 1",
      lastUpdated: "2023-04-20",
    },
    {
      id: "INV-002",
      name: "Silk Fabric - Blue",
      category: "Fabric",
      inStock: 45,
      unit: "yards",
      minStock: 30,
      maxStock: 150,
      reorderPoint: 50,
      location: "Warehouse A, Shelf 2",
      lastUpdated: "2023-04-19",
    },
    {
      id: "INV-003",
      name: "Polyester Blend - Black",
      category: "Fabric",
      inStock: 200,
      unit: "yards",
      minStock: 100,
      maxStock: 300,
      reorderPoint: 120,
      location: "Warehouse B, Shelf 1",
      lastUpdated: "2023-04-18",
    },
    {
      id: "INV-004",
      name: "Buttons - Assorted",
      category: "Accessories",
      inStock: 1500,
      unit: "pcs",
      minStock: 500,
      maxStock: 2000,
      reorderPoint: 750,
      location: "Warehouse C, Bin 5",
      lastUpdated: "2023-04-17",
    },
    {
      id: "INV-005",
      name: "Zippers - Black",
      category: "Accessories",
      inStock: 350,
      unit: "pcs",
      minStock: 200,
      maxStock: 1000,
      reorderPoint: 300,
      location: "Warehouse C, Bin 6",
      lastUpdated: "2023-04-16",
    },
    {
      id: "INV-006",
      name: "Thread - White",
      category: "Accessories",
      inStock: 85,
      unit: "spools",
      minStock: 50,
      maxStock: 200,
      reorderPoint: 75,
      location: "Warehouse C, Bin 2",
      lastUpdated: "2023-04-15",
    },
    {
      id: "INV-007",
      name: "Wool Fabric - Gray",
      category: "Fabric",
      inStock: 65,
      unit: "yards",
      minStock: 40,
      maxStock: 150,
      reorderPoint: 60,
      location: "Warehouse B, Shelf 3",
      lastUpdated: "2023-04-14",
    },
  ])

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

    // Generate new ID
    const newId = `INV-${String(inventory.length + 1).padStart(3, "0")}`

    // Add new item
    const itemToAdd = {
      ...newItem,
      id: newId,
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    setInventory([...inventory, itemToAdd])
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

  const handleUpdateItem = () => {
    if (!selectedItem) return

    setInventory(
      inventory.map((item) =>
        item.id === selectedItem.id
          ? {
              ...selectedItem,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : item,
      ),
    )

    setShowUpdateModal(false)
    setSelectedItem(null)

    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Inventory item updated successfully",
      life: 3000,
    })
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
          <div className="table-responsive">
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
                            <Dropdown.Item onClick={() => handleEditItem(item)}>Update Stock</Dropdown.Item>
                            <Dropdown.Item href="#">View Details</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item href="#">Reorder</Dropdown.Item>
                            <Dropdown.Item href="#">Move Location</Dropdown.Item>
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
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
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
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                placeholder="Warehouse A, Shelf 1"
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
                <Form.Label>Current Stock</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedItem.inStock}
                  onChange={(e) => setSelectedItem({ ...selectedItem, inStock: Number.parseInt(e.target.value) || 0 })}
                />
                <Form.Text className="text-muted">Current unit: {selectedItem.unit}</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedItem.location}
                  onChange={(e) => setSelectedItem({ ...selectedItem, location: e.target.value })}
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

