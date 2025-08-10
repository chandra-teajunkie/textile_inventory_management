"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DataGrid } from "react-data-grid"
import { Button, Form, Modal, Badge, Card, Dropdown, ButtonGroup } from "react-bootstrap"
import { FaTrash, FaPlus, FaUpload, FaEdit, FaTimes, FaFileExport, FaPrint } from "react-icons/fa"
import "react-data-grid/lib/styles.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import {
  detectDataType,
  normalizeCellForType,
  generateInitialColumns,
  generateInitialRows
} from '../lib/chartUtils'

function CustomChartComponent({ data, onSubmit, chartType = "chart", onResetToOrderChart }) {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState("")
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)
  const [newColumnName, setNewColumnName] = useState("")
  const [newColumnType, setNewColumnType] = useState("string")
  const [editColumnName, setEditColumnName] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [originalColumnOrder, setOriginalColumnOrder] = useState([])
  const gridRef = useRef(null)
  const submitTimeoutRef = useRef(null)

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
    number: (props) => <div style={{ textAlign: "center" }}>{props.row[props.column.key] ?? ""}</div>,
    string: (props) => <div style={{ padding: "8px" }}>{props.row[props.column.key] ?? ""}</div>,
    boolean: (props) => <div style={{ textAlign: "center" }}>{props.row[props.column.key] ? "✓" : "✗"}</div>,
    date: (props) => (
      <div style={{ textAlign: "center" }}>
        {props.row[props.column.key] ? new Date(props.row[props.column.key]).toLocaleDateString() : ""}
      </div>
    ),
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
    []
  )

  // Convert Python backend JSON format to grid format
  const loadDataFromBackend = useCallback((backendData) => {
    if (!backendData || typeof backendData !== "object") {
      initializeDefaultData()
      return
    }

    const keys = Object.keys(backendData)
    if (keys.length === 0) {
      initializeDefaultData()
      return
    }

    // Get all possible row indices
    const allIndices = new Set()
    keys.forEach((key) => {
      if (typeof backendData[key] === "object" && backendData[key] !== null) {
        Object.keys(backendData[key]).forEach((index) => allIndices.add(Number.parseInt(index)))
      }
    })

    const sortedIndices = Array.from(allIndices).sort((a, b) => a - b)

    // Create columns
    const newColumns = keys.map((key) => {
      // Detect data type from first non-null value
      let dataType = "string"
      for (const index of sortedIndices) {
        const value = backendData[key][index]
        if (value !== null && value !== undefined) {
          dataType = detectDataType(value)
          break
        }
      }

      return {
        key,
        name: key,
        dataType,
        editable: true,
        renderEditCell: dataTypeEditors[dataType],
        formatter: (props) => dataTypeFormatters[dataType](props.row[props.column.key]),
      }
    })

    // Add actions column
    newColumns.push({
      key: "actions",
      name: "Actions",
      width: 100,
      resizable: false,
      sortable: false,
      renderCell: ActionCellRenderer,
    })

    // Create rows
    const newRows = sortedIndices.map((index, rowIndex) => {
      const row = { __index: rowIndex }
      keys.forEach((key) => {
        row[key] = backendData[key][index] ?? null
      })
      return row
    })

    setColumns(newColumns)
    setRows(newRows)
    setOriginalColumnOrder(keys)
  }, [])

  const initializeDefaultData = () => {
    const defaultColumns = generateInitialColumns(dataTypeEditors, dataTypeFormatters, ActionCellRenderer)
    const defaultRows = generateInitialRows([], [])

    setColumns(defaultColumns)
    setRows(defaultRows)
    setOriginalColumnOrder(["Item", "Color", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"])
  }

  // Initialize with provided data or default - only run once
  useEffect(() => {
    if (!isInitialized) {
      if (data) {
        loadDataFromBackend(data)
      } else {
        initializeDefaultData()
      }
      setIsInitialized(true)
    }
  }, [data, loadDataFromBackend, isInitialized])

  // Debounced submit function to prevent infinite loops
  const debouncedSubmit = useCallback(
    (result) => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }

      submitTimeoutRef.current = setTimeout(() => {
        onSubmit(result)
      }, 300) // 300ms debounce
    },
    [onSubmit],
  )

  // Convert grid data back to backend format and submit - with debouncing
  useEffect(() => {
    if (isInitialized && columns.length > 0 && rows.length > 0) {
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

    // Cleanup timeout on unmount
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [columns, rows, isInitialized, debouncedSubmit])

  // File upload handler
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

          // Convert to backend format
          const convertedData = {}
          headers.forEach((header, colIndex) => {
            convertedData[header] = {}
            dataRows.forEach((row, rowIndex) => {
              convertedData[header][rowIndex] = row[colIndex] ?? null
            })
          })

          loadDataFromBackend(convertedData)
        } catch (error) {
          console.error("Error parsing file:", error)
          alert("Error parsing file. Please check the file format.")
        }
      }
      reader.readAsArrayBuffer(file)
    },
    [loadDataFromBackend],
  )

  // Export to CSV
  const exportToCSV = () => {
    if (rows.length === 0 || columns.length === 0) return

    const headers = columns
      .filter((col) => col.key !== "actions")
      .map((col) => col.name)

    const dataRows = rows.map((row) => {
      return columns
        .filter((col) => col.key !== "actions")
        .map((col) => {
          const value = row[col.key]
          if (col.dataType === "date" && value) {
            return new Date(value).toLocaleDateString()
          }
          return value !== null && value !== undefined ? value : ""
        })
    })

    const csvContent = [
      headers.join(","),
      ...dataRows.map((row) => row.join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${chartType}_data_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to Excel
  const exportToExcel = () => {
    if (rows.length === 0 || columns.length === 0) return

    const headers = columns
      .filter((col) => col.key !== "actions")
      .map((col) => col.name)

    const dataRows = rows.map((row) => {
      return columns
        .filter((col) => col.key !== "actions")
        .map((col) => {
          const value = row[col.key]
          if (col.dataType === "date" && value) {
            return new Date(value)
          }
          return value !== null && value !== undefined ? value : ""
        })
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${chartType}_data_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Export to PDF
  const exportToPDF = () => {
    if (rows.length === 0 || columns.length === 0) return

    const doc = new jsPDF()
    const title = `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Data`
    const headers = columns
      .filter((col) => col.key !== "actions")
      .map((col) => col.name)

    const dataRows = rows.map((row) => {
      return columns
        .filter((col) => col.key !== "actions")
        .map((col) => {
          const value = row[col.key]
          if (col.dataType === "date" && value) {
            return new Date(value).toLocaleDateString()
          } else if (col.dataType === "boolean") {
            return value ? "Yes" : "No"
          }
          return value !== null && value !== undefined ? value.toString() : ""
        })
    })

    doc.text(title, 14, 10)
    autoTable(doc, { // Use the imported autoTable function
      head: [headers],
      body: dataRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    })

    doc.save(`${chartType}_data_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  // Add the print function
  const handlePrint = () => {
    if (rows.length === 0 || columns.length === 0) {
      alert("No data to print")
      return
    }

    const printWindow = window.open('', '', 'width=800,height=600')
    printWindow.document.write(`
    <html>
      <head>
        <title>${chartType} Chart Print</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${chartType} Chart</h1>
        <table>
          <thead>
            <tr>
              ${columns
        .filter(col => col.key !== 'actions')
        .map(col => `<th>${col.name}</th>`)
        .join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${columns
            .filter(col => col.key !== 'actions')
            .map(col => {
              const value = row[col.key]
              let displayValue = value
              if (col.dataType === 'date' && value) {
                displayValue = new Date(value).toLocaleDateString()
              } else if (col.dataType === 'boolean') {
                displayValue = value ? '✓' : '✗'
              }
              return `<td>${displayValue ?? ''}</td>`
            })
            .join('')}
              </tr>
            `).join('')}
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

  // Add new row
  const addRow = () => {
    if (columns.length === 0) {
      alert("Please add columns first")
      return
    }
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    const newRow = columns.reduce((row, col) => {
      if (col.key === "actions") return row

      switch (col.dataType) {
        case "string":
          row[col.key] = ""
          break
        case "number":
          row[col.key] = 0
          break
        case "boolean":
          row[col.key] = false
          break
        case "date":
          row[col.key] = today
          break
        default:
          row[col.key] = ""
      }

      return row
    }, { __index: rows.length })

    setRows((prev) => [...prev, newRow])
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

  // Edit column name
  const handleEditColumn = (columnKey) => {
    if (!editColumnName.trim() || editColumnName === columnKey) {
      setEditingColumn(null)
      setEditColumnName("")
      return
    }

    const newKey = editColumnName.replace(/\s+/g, "_")

    setColumns((cols) =>
      cols.map((col) => (col.key === columnKey ? { ...col, key: newKey, name: editColumnName } : col)),
    )

    setRows((rs) =>
      rs.map((row) => {
        const newRow = { ...row }
        if (columnKey !== newKey) {
          newRow[newKey] = newRow[columnKey]
          delete newRow[columnKey]
        }
        return newRow
      }),
    )

    setEditingColumn(null)
    setEditColumnName("")
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

  // Delete a row
  const deleteRow = (rowIdx) => {
    setRows((prevRows) => {
      const newRows = prevRows.filter((row) => row.__index !== rowIdx)
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

  const getChartTypeColor = () => {
    switch (chartType) {
      case "incoming":
        return "primary"
      case "outgoing":
        return "success"
      default:
        return "info"
    }
  }

  const getChartTypeIcon = () => {
    switch (chartType) {
      case "incoming":
        return "📥"
      case "outgoing":
        return "📤"
      default:
        return "📊"
    }
  }

  const handleResetToOrderChart = () => {
    if (onResetToOrderChart) {
      onResetToOrderChart()
      setIsInitialized(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-3">
        {/* Action Buttons */}
        <div className="d-flex justify-content-between mb-3 flex-wrap">
          {/* Left-aligned buttons */}
          <div className="d-flex gap-2 flex-wrap">
            <div className="position-relative">
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="position-absolute w-100 h-100 opacity-0"
                style={{ cursor: "pointer", zIndex: 2 }}
                id={`file-upload-${chartType}`}
              />
              <Button variant="outline-primary" size="sm" className="position-relative">
                <FaUpload className="me-1" />
                Upload
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

            {onResetToOrderChart && (
              <Button onClick={handleResetToOrderChart} variant="outline-warning" size="sm">
                🔄 Reset to Order Chart
              </Button>
            )}
          </div>

          {/* Right-aligned export buttons */}
          <div className="d-flex gap-2 flex-wrap">
            <Button onClick={handlePrint} variant="outline-secondary" size="sm">
              <FaPrint className="me-1" />
              Print
            </Button>

            <Dropdown as={ButtonGroup}>
              <Button variant="outline-secondary" size="sm">
                <FaFileExport className="me-1" />
                Export
              </Button>
              <Dropdown.Toggle split variant="outline-secondary" size="sm" />
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToCSV}>CSV</Dropdown.Item>
                <Dropdown.Item onClick={exportToExcel}>Excel</Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}>PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Data Grid */}
        {columns.length > 0 && (
          <div className="border rounded overflow-hidden" style={{ backgroundColor: "#f8f9fa" }}>
            <div
              ref={gridRef}
              style={{
                height: "300px",
                width: "100%",
              }}
            >
              <DataGrid
                columns={columns.map((col) => ({
                  ...col,
                  headerRenderer: () => (
                    <div
                      className="d-flex align-items-center justify-content-between w-100 h-100 px-2"
                      style={{ minHeight: "35px" }}
                    >
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        {editingColumn === col.key ? (
                          <Form.Control
                            size="sm"
                            value={editColumnName}
                            onChange={(e) => setEditColumnName(e.target.value)}
                            onBlur={() => handleEditColumn(col.key)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleEditColumn(col.key)
                              } else if (e.key === "Escape") {
                                setEditingColumn(null)
                                setEditColumnName("")
                              }
                            }}
                            autoFocus
                            style={{ minWidth: "80px" }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center gap-1 flex-grow-1"
                            style={{
                              cursor: col.key !== "actions" ? "pointer" : "default",
                              minWidth: 0,
                            }}
                            onClick={() => {
                              if (col.key !== "actions") {
                                setEditingColumn(col.key)
                                setEditColumnName(col.name)
                              }
                            }}
                          >
                            <span className="fw-bold text-truncate small">{col.name}</span>
                            {col.key !== "actions" && <FaEdit size={8} className="opacity-50" />}
                          </div>
                        )}
                        {col.dataType && (
                          <Badge bg="light" text="dark" className="small" style={{ fontSize: "9px" }}>
                            {col.dataType}
                          </Badge>
                        )}
                      </div>
                      {col.key !== "actions" && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteColumn(col.key)
                          }}
                          className="p-0 text-danger ms-1"
                          style={{ border: "none", background: "none" }}
                        >
                          <FaTimes size={10} />
                        </Button>
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
                  "--rdg-header-background-color": "#e9ecef",
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
      </Card.Body>
    </Card>
  )
}

export default CustomChartComponent