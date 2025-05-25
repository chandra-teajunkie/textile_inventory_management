"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DataGrid } from "react-data-grid"
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

export default function EnhancedDataGrid({ onSubmit }) {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState("")
  const gridRef = useRef(null)

  // Initialize with sample data
  useEffect(() => {
    if (columns.length === 0 && rows.length === 0) {
      setColumns([
        {
          key: "Size",
          name: "Size",
          dataType: "string",
          editable: true,
          renderEditCell: dataTypeEditors.string,
          renderCell: (props) => dataTypeFormatters.string(props.row[props.column.key]),
        },
        {
          key: "Quantity",
          name: "Quantity",
          dataType: "number",
          editable: true,
          renderEditCell: dataTypeEditors.number,
          renderCell: (props) => dataTypeFormatters.number(props.row[props.column.key]),
        },
        {
          key: "actions",
          name: "Actions",
          renderCell: (props) => (
            <button onClick={() => deleteRow(props.row.__index)} className="delete-row-btn">
              Delete
            </button>
          ),
        },
      ])
      setRows([
        { Size: "S", Quantity: 10, __index: 0 },
        { Size: "M", Quantity: 20, __index: 1 },
        { Size: "L", Quantity: 15, __index: 2 },
      ])
    }
  }, [])

  // Fix for ResizeObserver error - update grid when container size changes
  useEffect(() => {
    // Auto-submit when data changes
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

      // Debounce the submission to avoid too many updates
      // const timer = setTimeout(() => {
      onSubmit(result)
      // }, 500)

      // return () => clearTimeout(timer)
    }
  }, [columns, rows])

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
          renderCell: (props) => dataTypeFormatters[columnTypes[header]](props.row[header]),
        }))

        // Add actions column
        newColumns.push({
          key: "actions",
          name: "Actions",
          renderCell: (props) => (
            <button onClick={() => deleteRow(props.row.__index)} className="delete-row-btn">
              Delete
            </button>
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

  // Add new row with null values
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

  // Add new column with specified type
  const addColumn = () => {
    const name = prompt("Column name:")
    if (!name) return

    let type = prompt("Data type (string/number/boolean/date):", "string")
    if (!["string", "number", "boolean", "date"].includes(type)) {
      alert("Invalid data type. Using string as default.")
      type = "string"
    }

    const key = name.replace(/\s+/g, "_")
    const newColumn = {
      key,
      name,
      dataType: type,
      editable: true,
      renderEditCell: dataTypeEditors[type],
      renderCell: (props) => dataTypeFormatters[type](props.row[key]),
    }

    // Insert before actions column or at the end
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
        [key]: type === "string" ? "" : type === "number" ? null : type === "boolean" ? false : null, // date
      })),
    )
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
      // Create a new array without the row to delete
      const newRows = prevRows.filter((row) => row.__index !== rowIdx)

      // Update the __index values to be sequential
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
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label
          className="file-upload-button"
          style={{
            padding: "8px 12px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            cursor: "pointer",
            border: "1px solid #ccc",
          }}
        >
          📁 Upload CSV/Excel
          <input type="file" accept=".csv,.xls,.xlsx" onChange={handleFileUpload} style={{ display: "none" }} />
        </label>

        <button
          onClick={addRow}
          style={{
            padding: "8px 12px",
            backgroundColor: "#e3f2fd",
            border: "1px solid #bbdefb",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ➕ Add Row
        </button>

        <button
          onClick={addColumn}
          style={{
            padding: "8px 12px",
            backgroundColor: "#e8f5e9",
            border: "1px solid #c8e6c9",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ➕ Add Column
        </button>

        {fileName && <span style={{ marginLeft: "auto", alignSelf: "center", color: "#666" }}>Loaded: {fileName}</span>}
      </div>

      {columns.length > 0 && (
        <>
          <div
            ref={gridRef}
            style={{
              height: "400px",
              width: "100%",
              position: "relative",
              contain: "strict", // Helps with ResizeObserver issues
            }}
          >
            <DataGrid
              columns={columns.map((col) => ({
                ...col,
                headerRenderer: (p) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <span>{col.name}</span>
                      {col.dataType && (
                        <span
                          style={{
                            fontSize: "0.8em",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          ({col.dataType})
                        </span>
                      )}
                    </div>
                    {col.key !== "actions" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteColumn(col.key)
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "red",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: "0 4px",
                        }}
                        title="Delete column"
                      >
                        ×
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
            />
          </div>

          <div style={{ marginTop: "16px", color: "#666" }}>
            <p>
              <strong>Editing Tips:</strong> Click cells to edit.
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        .delete-row-btn {
          background: #ffebee;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          padding: 2px 6px;
          cursor: pointer;
          color: #c62828;
        }
        .delete-row-btn:hover {
          background: #ffcdd2;
        }
        .rdg-text-editor {
          width: 100%;
          height: 100%;
          border: none;
          padding: 0 8px;
        }
      `}</style>
    </div>
  )
}
