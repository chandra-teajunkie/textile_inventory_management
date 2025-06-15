"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { DataGrid } from "react-data-grid"
import { Button, Form, Modal, Badge } from "react-bootstrap"
import { FaTrash, FaPlus, FaUpload, FaTimes } from "react-icons/fa"
import "react-data-grid/lib/styles.css"
import * as XLSX from "xlsx"
import './order.css';

// Suppress ResizeObserver errors
const suppressResizeObserverError = () => {
  const resizeObserverErr = window.console.error
  window.console.error = (...args) => {
    if (
      args[0]?.includes?.("ResizeObserver loop completed with undelivered notifications") ||
      args[0]?.includes?.("ResizeObserver loop limit exceeded")
    ) {
      return
    }
    resizeObserverErr(...args)
  }
}

// Initialize error suppression
if (typeof window !== "undefined") {
  suppressResizeObserverError()
}

// Helper function to detect data type
const detectDataType = (value) => {
  if (value === null || value === undefined || value === "") return "string"
  if (!isNaN(value) && value.toString().trim() !== "") return "number"
  if (typeof value === "boolean") return "boolean"
  if (Date.parse(value)) return "date"
  return "string"
}

// Column width calculator based on data type
const getColumnWidth = (dataType, columnName) => {
  switch (dataType) {
    case "number":
      return 80 // Compact width for numbers
    case "boolean":
      return 70 // Small width for checkboxes
    case "date":
      return 120 // Medium width for dates
    case "string":
    default:
      // Give text columns more space, with minimum and maximum limits
      const baseWidth = Math.max(columnName.length * 12, 150)
      return Math.min(baseWidth, 300)
  }
}

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
  const resizeTimeoutRef = useRef(null)

  // Memoized data type editors
  const dataTypeEditors = useMemo(
    () => ({
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
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            padding: "4px",
            outline: "none",
            textAlign: "center",
          }}
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
          style={{ width: "100%", height: "100%", border: "none", padding: "4px", outline: "none" }}
          autoFocus
        />
      ),
    }),
    [],
  )

  // Memoized data type formatters
  const dataTypeFormatters = useMemo(
    () => ({
      number: (props) => <div style={{ textAlign: "center", padding: "4px" }}>{props.row[props.column.key] ?? ""}</div>,
      string: (props) => (
        <div style={{ padding: "4px 8px", overflow: "hidden", textOverflow: "ellipsis" }}>
          {props.row[props.column.key] ?? ""}
        </div>
      ),
      boolean: (props) => (
        <div style={{ textAlign: "center", padding: "4px" }}>{props.row[props.column.key] ? "✓" : "✗"}</div>
      ),
      date: (props) => (
        <div style={{ padding: "4px", textAlign: "center" }}>
          {props.row[props.column.key] ? new Date(props.row[props.column.key]).toLocaleDateString() : ""}
        </div>
      ),
    }),
    [],
  )

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

  // Memoized delete row function
  const deleteRow = useCallback((rowIdx) => {
    setRows((prevRows) => {
      const newRows = prevRows.filter((row) => row.__index !== rowIdx)
      // Re-index the remaining rows to maintain sequential order
      return newRows.map((row, idx) => ({
        ...row,
        __index: idx,
      }))
    })
  }, [])

  // Memoized delete column function
  const deleteColumn = useCallback((key) => {
    if (key === "actions") return

    setColumns((cols) => cols.filter((c) => c.key !== key))
    setRows((rs) =>
      rs.map((row) => {
        const newRow = { ...row }
        delete newRow[key]
        return newRow
      }),
    )
  }, [])

  // Memoized action cell renderer
  const ActionCellRenderer = useCallback(
    ({ row }) => (
      <div className="d-flex justify-content-center align-items-center h-100">
        <Button
          variant="link"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            deleteRow(row.__index)
          }}
          className="p-1 text-danger"
          style={{ border: "none", background: "none" }}
          title="Delete row"
        >
          <FaTrash />
        </Button>
      </div>
    ),
    [deleteRow],
  )

  // Memoized header renderer
  const HeaderRenderer = useCallback(
    ({ column }) => (
      <div
        className="d-flex align-items-center justify-content-between w-100 h-100 px-2"
        style={{
          minHeight: "35px",
          backgroundColor: "#343a40",
          color: "#ffffff",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          <span
            className="fw-bold text-truncate small text-white"
            style={{
              fontSize: column.dataType === "number" ? "11px" : "12px",
              textAlign: column.dataType === "number" ? "center" : "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {column.name}
          </span>
          {column.dataType && (
            <Badge bg="secondary" className="small" style={{ fontSize: "8px" }}>
              {column.dataType === "number"
                ? "#"
                : column.dataType === "string"
                  ? "T"
                  : column.dataType === "boolean"
                    ? "B"
                    : "D"}
            </Badge>
          )}
        </div>
        {
          column.key !== "actions" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteColumn(column.key)
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
              <FaTimes size={10} />
            </button>
          )
        }
      </div >
    ),
    [deleteColumn],
  )

  // Memoized initial columns with proper widths
  const initialColumns = useMemo(
    () => [
      {
        key: "Item",
        name: "Item",
        dataType: "string",
        editable: true,
        headerAlign: 'center',
        resizable: true,
        sortable: true,
        // width: getColumnWidth("string", "Item"),
        renderEditCell: dataTypeEditors.string,
        renderCell: dataTypeFormatters.string,
      },
      {
        key: "Color",
        name: "Color",
        dataType: "string",
        editable: true,
        headerAlign: 'center',
        resizable: true,
        sortable: true,
        // width: getColumnWidth("string", "Color"),
        renderEditCell: dataTypeEditors.string,
        renderCell: dataTypeFormatters.string,
      },
      ...["24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"].map((size) => ({
        key: size,
        name: size,
        dataType: "number",
        editable: true,
        headerAlign: 'center',
        resizable: true,
        sortable: true,
        // width: getColumnWidth("number", size),
        renderEditCell: dataTypeEditors.number,
        renderCell: dataTypeFormatters.number,
      })),
      {
        key: "actions",
        name: "Actions",
        headerAlign: 'center',
        // width: 80,
        resizable: true,
        sortable: false,
        renderCell: ActionCellRenderer,
      },
    ],
    [dataTypeEditors, dataTypeFormatters, ActionCellRenderer],
  )

  // Memoized initial rows
  const initialRows = useMemo(
    () => [
      {
        Item: "Pant",
        Color: "Blue",
        24: 0,
        26: 0,
        28: 0,
        30: 0,
        32: 0,
        34: 0,
        36: 0,
        38: 0,
        40: 0,
        42: 0,
        44: 0,
        __index: 0,
      },
      {
        Item: "Shirt",
        Color: "White",
        24: 0,
        26: 0,
        28: 0,
        30: 0,
        32: 0,
        34: 0,
        36: 0,
        38: 0,
        40: 0,
        42: 0,
        44: 0,
        __index: 1,
      },
    ],
    [],
  )

  // Initialize with sample data
  useEffect(() => {
    if (columns.length === 0 && rows.length === 0) {
      setColumns(initialColumns)
      setRows(initialRows)
    }
  }, [columns.length, rows.length, initialColumns, initialRows])

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
          onSubmit?.(result)
        }
      }, 500)
    },
    [onSubmit],
  )

  // Memoized result calculation
  const calculatedResult = useMemo(() => {
    if (columns.length === 0 || rows.length === 0) return null

    const result = {}
    columns.forEach((col) => {
      if (col.key !== "actions") {
        result[col.key] = {}
        rows.forEach((row, index) => {
          result[col.key][index] = row[col.key]
        })
      }
    })
    return result
  }, [columns, rows])

  // Submit data when it changes
  useEffect(() => {
    if (calculatedResult) {
      debouncedSubmit(calculatedResult)
    }

    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [calculatedResult, debouncedSubmit])

  // Process uploaded file with data type detection
  const handleFileUpload = useCallback(
    (e) => {
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

          // Create columns with data types and proper widths
          const newColumns = headers.map((header) => ({
            key: header,
            name: header,
            dataType: columnTypes[header],
            editable: true,
            width: getColumnWidth(columnTypes[header], header),
            renderEditCell: dataTypeEditors[columnTypes[header]],
            renderCell: dataTypeFormatters[columnTypes[header]],
          }))

          // Add actions column
          newColumns.push({
            key: "actions",
            name: "Actions",
            width: 80,
            resizable: false,
            sortable: false,
            renderCell: ActionCellRenderer,
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
    },
    [dataTypeEditors, dataTypeFormatters, ActionCellRenderer],
  )

  // Add new row
  const addRow = useCallback(() => {
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
    setRows((prev) => [...prev, newRow])
  }, [columns, rows.length])

  // Add new column
  const handleAddColumn = useCallback(() => {
    if (!newColumnName.trim()) return

    const key = newColumnName.replace(/\s+/g, "_")
    const newColumn = {
      key,
      name: newColumnName,
      dataType: newColumnType,
      editable: true,
      width: getColumnWidth(newColumnType, newColumnName),
      renderEditCell: dataTypeEditors[newColumnType],
      renderCell: dataTypeFormatters[newColumnType],
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
    setRows((prev) =>
      prev.map((row) => ({
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
  }, [newColumnName, newColumnType, columns, dataTypeEditors, dataTypeFormatters])

  // Handle cell value changes with debouncing
  const onRowsChange = useCallback((newRows) => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }

    resizeTimeoutRef.current = setTimeout(() => {
      setRows(newRows)
    }, 16) // Debounce to next frame
  }, [])

  // Memoized columns with header renderers
  const memoizedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        renderHeader: () => <HeaderRenderer column={col} />,
      })),
    [columns, HeaderRenderer],
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

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
              columns={memoizedColumns}
              rows={rows}
              onRowsChange={onRowsChange}
              defaultColumnOptions={{
                resizable: true,
                sortable: true,
              }}
              rowKeyGetter={(row) => row.__index}
              style={{
                "--rdg-header-foreground-color": "#ffffff",
                "--rdg-border-color": "#dee2e6",
                fontSize: "13px",
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
