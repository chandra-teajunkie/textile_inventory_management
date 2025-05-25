"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DataGrid } from "react-data-grid"
import { Button, Form, Modal, Badge } from "react-bootstrap"
import { FaTrash, FaPlus, FaUpload, FaTimes } from "react-icons/fa"
import "react-data-grid/lib/styles.css"
import * as XLSX from "xlsx"

// Helper function to detect data type
const detectDataType = (value) => {
  if (value === null || value === undefined || value === "") return "string"
  if (!isNaN(value) && value.toString().trim() !== "") return "number"
  if (typeof value === "boolean") return "boolean"
  if (Date.parse(value)) return "date"
  return "string"
}

// Data type editors
const dataTypeEditors = {
  number: (props) => (
    <input
      type="number"
      value={props.row[props.column.key] ?? ""}
      onChange={(e) =>
        props.onRowChange({
          ...props.row,
          [props.column.key]: e.target.value === "" ? null : Number(e.target.value),
        })
      }
      className="rdg-text-editor"
      style={{ width: "100%", height: "100%", border: "none", padding: "8px", outline: "none" }}
      autoFocus
    />
  ),
  string: (props) => (
    <input
      type="text"
      value={props.row[props.column.key] ?? ""}
      onChange={(e) =>
        props.onRowChange({
          ...props.row,
          [props.column.key]: e.target.value === "" ? null : e.target.value,
        })
      }
      className="rdg-text-editor"
      style={{ width: "100%", height: "100%", border: "none", padding: "8px", outline: "none" }}
      autoFocus
    />
  ),
  boolean: (props) => (
    <input
      type="checkbox"
      checked={!!props.row[props.column.key]}
      onChange={(e) =>
        props.onRowChange({
          ...props.row,
          [props.column.key]: e.target.checked,
        })
      }
      style={{ margin: "auto", display: "block" }}
      autoFocus
    />
  ),
  date: (props) => (
    <input
      type="date"
      value={props.row[props.column.key] ? new Date(props.row[props.column.key]).toISOString().split("T")[0] : ""}
      onChange={(e) =>
        props.onRowChange({
          ...props.row,
          [props.column.key]: e.target.value ? new Date(e.target.value) : null,
        })
      }
      className="rdg-text-editor"
      style={{ width: "100%", height: "100%", border: "none", padding: "8px", outline: "none" }}
      autoFocus
    />
  ),
}

// Data type formatters
const dataTypeFormatters = {
  number: (value) => value,
  string: (value) => value,
  boolean: (value) => (value ? "✓" : "✗"),
  date: (value) => (value ? new Date(value).toLocaleDateString() : ""),
}

const COLUMN_SUGGESTIONS = [
  "Size",
  "Quantity",
  "Price",
  "Name",
  "Description",
  "Category",
  "Status",
  "Date",
  "Email",
  "Phone",
  "Weight",
  "Color",
  "Material",
]

const DATA_TYPES = [
  { value: "string", label: "Text", icon: "📝" },
  { value: "number", label: "Number", icon: "🔢" },
  { value: "boolean", label: "Boolean", icon: "☑️" },
  { value: "date", label: "Date", icon: "📅" },
]

export default function EnhancedDataGrid({ onSubmit }) {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState("")
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [newColumnType, setNewColumnType] = useState("string")
  const gridRef = useRef(null)
  const submitTimeoutRef = useRef(null)
  const lastSubmittedDataRef = useRef(null)

  // Initialize with sample data
  useEffect(() => {
    if (columns.length === 0 && rows.length === 0) {
      const initialColumns = [
        {
          key: "Size",
          name: "Size",
          dataType: "string",
          editable: true,
          renderEditCell: dataTypeEditors.string,
          formatter: (props) => dataTypeFormatters.string(props.row[props.column.key]),
          headerRenderer: (props) => (
            <div style={{ fontWeight: 'bold', color: 'blue' }}>HI</div>
          ),
        },
        {
          key: "Quantity",
          name: "Quantity",
          dataType: "number",
          editable: true,
          renderEditCell: dataTypeEditors.number,
          formatter: (props) => dataTypeFormatters.number(props.row[props.column.key]),
        },
        {
          key: "actions",
          name: "Actions",
          width: 100,
          resizable: false,
          sortable: false,
          renderCell: (props) => (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Button
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteRow(props.row.__index)
                }}
                className="p-1 text-danger"
                style={{ border: "none", background: "none" }}
                title="Delete row"
              >
                <FaTrash />
              </Button>
            </div>
          ),
        },
      ]

      const initialRows = [
        { Size: "S", Quantity: 10, __index: 0 },
        { Size: "M", Quantity: 20, __index: 1 },
        { Size: "L", Quantity: 15, __index: 2 },
      ]

      setColumns(initialColumns)
      setRows(initialRows)
    }
  }, [])

  // Debounced submit function to prevent duplicate submissions
  const debouncedSubmit = useCallback(
    (result) => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }

      submitTimeoutRef.current = setTimeout(() => {
        // Check if data actually changed
        const currentDataString = JSON.stringify(result)
        if (lastSubmittedDataRef.current !== currentDataString) {
          lastSubmittedDataRef.current = currentDataString
          onSubmit(result)
        }
      }, 500) // Increased debounce time
    },
    [onSubmit],
  )

  // Submit data when it changes
  useEffect(() => {
    if (columns.length > 0 && rows.length > 0) {
      const result = {}
      columns.forEach((col) => {
        if (col.key !== "actions") {
          result[col.key] = {}
          rows.forEach((row, index) => {
            result[col.key][index] = row[col.key]
          })
        }
      })
      debouncedSubmit(result)
    }

    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [columns, rows, debouncedSubmit])

  // Process uploaded file with data type detection
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

        if (jsonData.length === 0) {
          alert("Empty file or no data found")
          return
        }

        const headers = jsonData[0].map((h, i) => h || `Column_${i + 1}`)
        const dataRows = jsonData.slice(1)

        // Detect data types for each column
        const columnTypes = {}
        headers.forEach((header, colIndex) => {
          const sampleValues = dataRows
            .slice(0, Math.min(10, dataRows.length))
            .map((row) => row[colIndex])
            .filter((val) => val !== null && val !== undefined && val !== "")

          if (sampleValues.length === 0) {
            columnTypes[header] = "string"
          } else {
            const typeCounts = sampleValues.reduce((acc, val) => {
              const type = detectDataType(val)
              acc[type] = (acc[type] || 0) + 1
              return acc
            }, {})

            columnTypes[header] = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
          }
        })

        // Create columns with data types
        const newColumns = headers.map((header) => ({
          key: header,
          name: header,
          dataType: columnTypes[header],
          editable: true,
          renderEditCell: dataTypeEditors[columnTypes[header]],
          formatter: (props) => dataTypeFormatters[columnTypes[header]](props.row[header]),
        }))

        // Add actions column
        newColumns.push({
          key: "actions",
          name: "Actions",
          width: 100,
          resizable: false,
          sortable: false,
          renderCell: (props) => (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Button
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteRow(props.row.__index)
                }}
                className="p-1 text-danger"
                style={{ border: "none", background: "none" }}
                title="Delete row"
              >
                <FaTrash />
              </Button>
            </div>
          ),
        })

        // Create rows with proper typing
        const newRows = dataRows.map((row, idx) => {
          const rowObj = { __index: idx }
          headers.forEach((header, colIndex) => {
            const value = row[colIndex]
            const type = columnTypes[header]

            switch (type) {
              case "number":
                rowObj[header] = value === null || value === "" ? null : Number(value)
                break
              case "boolean":
                rowObj[header] = Boolean(value)
                break
              case "date":
                rowObj[header] = value ? new Date(value) : null
                break
              default:
                rowObj[header] = value === null || value === undefined ? "" : String(value)
            }
          })
          return rowObj
        })

        setColumns(newColumns)
        setRows(newRows)
      } catch (error) {
        console.error("Error parsing file:", error)
        alert("Error parsing file. Please check the file format.")
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  // Add new row
  const addRow = () => {
    if (columns.length === 0) {
      alert("Please add columns first")
      return
    }
    const newRow = columns.reduce(
      (obj, col) => {
        if (col.key !== "actions") {
          obj[col.key] = col.dataType === "string" ? "" : null
        }
        return obj
      },
      { __index: rows.length },
    )
    setRows([...rows, newRow])
  }

  // Add new column
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return

    const key = newColumnName.replace(/\s+/g, "_")
    const newColumn = {
      key,
      name: newColumnName,
      dataType: newColumnType,
      editable: true,
      renderEditCell: dataTypeEditors[newColumnType],
      formatter: (props) => dataTypeFormatters[newColumnType](props.row[key]),
    }

    // Insert before actions column
    const newColumns = [...columns]
    const actionsIndex = newColumns.findIndex((col) => col.key === "actions")
    if (actionsIndex !== -1) {
      newColumns.splice(actionsIndex, 0, newColumn)
    } else {
      newColumns.push(newColumn)
    }

    setColumns(newColumns)
    setRows(
      rows.map((row) => ({
        ...row,
        [key]:
          newColumnType === "string"
            ? ""
            : newColumnType === "number"
              ? null
              : newColumnType === "boolean"
                ? false
                : null,
      })),
    )

    // Reset form
    setNewColumnName("")
    setNewColumnType("string")
    setIsAddColumnOpen(false)
  }

  // Delete a column
  const deleteColumn = (key) => {
    if (key === "actions") return

    setColumns((cols) => cols.filter((c) => c.key !== key))
    setRows((rs) =>
      rs.map((row) => {
        const newRow = { ...row }
        delete newRow[key]
        return newRow
      }),
    )
  }

  // Delete a row - Fixed to prevent reordering issues
  const deleteRow = (rowIdx) => {
    setRows((prevRows) => {
      const newRows = prevRows.filter((row) => row.__index !== rowIdx)
      // Re-index the remaining rows to maintain sequential order
      return newRows.map((row, idx) => ({
        ...row,
        __index: idx,
      }))
    })
  }

  // Handle cell value changes
  const onRowsChange = (newRows) => {
    setRows(newRows)
  }

  return (
    <div style={{ padding: "20px", maxWidth: "100%", overflowX: "auto" }}>
      {/* Action Buttons */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div className="position-relative">
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileUpload}
            className="position-absolute w-100 h-100 opacity-0"
            style={{ cursor: "pointer", zIndex: 2 }}
            id="file-upload"
          />
          <Button variant="outline-primary" size="sm" className="position-relative">
            <FaUpload className="me-1" />
            Upload CSV/Excel
          </Button>
        </div>

        <Button onClick={addRow} variant="outline-success" size="sm">
          <FaPlus className="me-1" />
          Add Row
        </Button>

        <Button onClick={() => setIsAddColumnOpen(true)} variant="outline-info" size="sm">
          <FaPlus className="me-1" />
          Add Column
        </Button>

        {fileName && (
          <Badge bg="light" text="dark" className="ms-auto align-self-center">
            📁 {fileName}
          </Badge>
        )}
      </div>

      {/* Data Grid */}
      {columns.length > 0 && (
        <div className="border rounded overflow-hidden" style={{ backgroundColor: "#f8f9fa" }}>
          <div
            ref={gridRef}
            style={{
              height: "400px",
              width: "100%",
            }}
          >
            <DataGrid
              columns={columns.map((col) => ({
                ...col,
                renderHeader: () => (
                  <div
                    className="d-flex align-items-center justify-content-between w-100 h-100 px-2"
                    style={{
                      minHeight: "35px",
                      backgroundColor: "#343a40", // Dark background
                      color: "#ffffff", // White text
                      fontWeight: "bold",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <span className="fw-bold text-truncate small text-white">{col.name}</span>
                      {col.dataType && (
                        <Badge bg="secondary" className="small" style={{ fontSize: "9px" }}>
                          {col.dataType}
                        </Badge>
                      )}
                    </div>
                    {col.key !== "actions" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteColumn(col.key)
                        }}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                          padding: "2px 4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Delete column"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                ),
              }))}
              rows={rows}
              onRowsChange={onRowsChange}
              defaultColumnOptions={{
                resizable: true,
                sortable: true,
              }}
              rowKeyGetter={(row) => row.__index}
              style={{
                "--rdg-header-background-color": "#343a40", // Dark header
                "--rdg-header-foreground-color": "#ffffff", // White text
                "--rdg-border-color": "#dee2e6",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
      )}

      {/* Add Column Modal */}
      <Modal show={isAddColumnOpen} onHide={() => setIsAddColumnOpen(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaPlus className="me-2" />
            Add New Column
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Column Name</Form.Label>
            <Form.Select value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className="mb-2">
              <option value="">Select suggested name...</option>
              {COLUMN_SUGGESTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Form.Select>
            <Form.Control
              placeholder="Or enter custom name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Data Type</Form.Label>
            <Form.Select value={newColumnType} onChange={(e) => setNewColumnType(e.target.value)}>
              {DATA_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setIsAddColumnOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddColumn} disabled={!newColumnName.trim()}>
            Add Column
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Tips */}
      <div className="mt-3 text-muted">
        <small>
          <strong>Tips:</strong> Click cells to edit • Use column delete (×) buttons to remove columns • Upload
          CSV/Excel files to import data
        </small>
      </div>
    </div>
  )
}
