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
        // Map backend Inventory model fields directly to UI state
        const mapped = data.map((item) => ({
          id: item.inventory_id || item.id,
          storage_location: item.storage_location || "",
          material_type: item.material_type || "",
          color: item.color || "",
          quantity_weight: item.quantity_weight ?? 0,
          quantity_bags: item.quantity_bags ?? null,
          weight_per_bag: item.weight_per_bag ?? null,
          material: item.material || "",
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
    // Backend InventoryCreate fields
    material: "",
    material_type: "Fabric",
    color: "",
    quantity_weight: 0,
    quantity_bags: null,
    weight_per_bag: null,
    storage_location: "",
  })

  // Simple helper to format quantity
  const formatQuantity = (q) => (q === null || typeof q === "undefined" ? "-" : q)

  // Stock status helpers (fallback when no min/max data available)
  const getStockStatus = (item) => {
    const q = Number(item.quantity_weight || 0)
    if (q <= 0) return { status: "Out of Stock", color: "danger" }
    return { status: "In Stock", color: "success" }
  }

  const getStockPercentage = (item) => {
    const q = Number(item.quantity_weight || 0)
    return q > 0 ? 100 : 0
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleAddItem = () => {
    // Validate form
    if (!newItem.material || !newItem.material_type || !newItem.storage_location) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please fill all required fields",
        life: 3000,
      })
      return
    }

    const create = async () => {
      // Map frontend form to backend InventoryCreate model
      const payload = {
        storage_location: newItem.storage_location || "",
        material_type: newItem.material_type || "",
        color: newItem.color || "",
        quantity_weight: Number(newItem.quantity_weight || 0),
        quantity_bags: newItem.quantity_bags ? Number(newItem.quantity_bags) : null,
        weight_per_bag: newItem.weight_per_bag ? Number(newItem.weight_per_bag) : null,
        material: newItem.material || "",
      }

      try {
        const res = await fetch(INVENTORY_API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error(`Create failed: ${res.status}`)

        const created = await res.json()
        // Map backend Inventory model to UI-friendly fields
        const mapped = {
          id: created.inventory_id || created.id,
          storage_location: created.storage_location || "",
          material_type: created.material_type || "",
          color: created.color || "",
          quantity_weight: created.quantity_weight ?? 0,
          quantity_bags: created.quantity_bags ?? null,
          weight_per_bag: created.weight_per_bag ?? null,
          material: created.material || "",
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
          material: "",
          material_type: "Fabric",
          color: "",
          quantity_weight: 0,
          quantity_bags: null,
          weight_per_bag: null,
          storage_location: "",
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
        // Patch payload uses backend InventoryUpdate fields
        const payload = {
          storage_location: selectedItem.storage_location || "",
          material_type: selectedItem.material_type || "",
          color: selectedItem.color || "",
          quantity_weight: Number(selectedItem.quantity_weight ?? 0),
          quantity_bags: selectedItem.quantity_bags ? Number(selectedItem.quantity_bags) : null,
          weight_per_bag: selectedItem.weight_per_bag ? Number(selectedItem.weight_per_bag) : null,
          material: selectedItem.material || "",
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
          storage_location: updated.storage_location || selectedItem.storage_location || "",
          material_type: updated.material_type || selectedItem.material_type || "",
          color: updated.color || selectedItem.color || "",
          quantity_weight: updated.quantity_weight ?? selectedItem.quantity_weight ?? 0,
          quantity_bags: typeof updated.quantity_bags !== "undefined" ? updated.quantity_bags : selectedItem.quantity_bags,
          weight_per_bag: typeof updated.weight_per_bag !== "undefined" ? updated.weight_per_bag : selectedItem.weight_per_bag,
          material: updated.material || selectedItem.material || "",
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
    .filter((item) => filterCategory === "all" || item.material_type === filterCategory)
    .filter((item) => {
      const q = (searchTerm || "").toLowerCase()
      const mat = (item.material || "").toLowerCase()
      const mid = (item.id || "").toLowerCase()
      const mtype = (item.material_type || "").toLowerCase()
      return mat.includes(q) || mid.includes(q) || mtype.includes(q)
    })

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
            <th>Material</th>
              <th>Type</th>
              <th>Quantity (kg)</th>
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
                      <td>{item.material}</td>
                      <td>{item.material_type}</td>
                      <td>{formatQuantity(item.quantity_weight)}</td>
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
              <Form.Label>Material <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newItem.material}
                onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                placeholder="Yarn, Cotton, etc."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={newItem.material_type}
                onChange={(e) => setNewItem({ ...newItem, material_type: e.target.value })}
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
                  <Form.Label>Quantity (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newItem.quantity_weight}
                    onChange={(e) => setNewItem({ ...newItem, quantity_weight: parseFloat(e.target.value) || 0 })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Color</Form.Label>
                  <Form.Control type="text" value={newItem.color} onChange={(e) => setNewItem({ ...newItem, color: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Quantity (bags)</Form.Label>
                  <Form.Control
                    type="number"
                    value={newItem.quantity_bags ?? ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity_bags: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Weight per bag</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newItem.weight_per_bag ?? ""}
                    onChange={(e) => setNewItem({ ...newItem, weight_per_bag: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Storage Location <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newItem.storage_location}
                onChange={(e) => setNewItem({ ...newItem, storage_location: e.target.value })}
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
                <Form.Label>Material <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={selectedItem.material}
                  onChange={(e) => setSelectedItem({ ...selectedItem, material: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={selectedItem.material_type}
                  onChange={(e) => setSelectedItem({ ...selectedItem, material_type: e.target.value })}
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
                    <Form.Label>Quantity (kg) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={selectedItem.quantity_weight}
                      onChange={(e) => setSelectedItem({ ...selectedItem, quantity_weight: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Color</Form.Label>
                    <Form.Control type="text" value={selectedItem.color} onChange={(e) => setSelectedItem({ ...selectedItem, color: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Quantity (bags)</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedItem.quantity_bags ?? ""}
                      onChange={(e) => setSelectedItem({ ...selectedItem, quantity_bags: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Weight per bag</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={selectedItem.weight_per_bag ?? ""}
                      onChange={(e) => setSelectedItem({ ...selectedItem, weight_per_bag: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Storage Location <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={selectedItem.storage_location}
                  onChange={(e) => setSelectedItem({ ...selectedItem, storage_location: e.target.value })}
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

