"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import DataGrid from "react-data-grid";
import { Button, Form, Modal, Badge } from "react-bootstrap";
import { FaTrash, FaPlus, FaUpload, FaTimes, FaFileCsv, FaFileExcel, FaPrint, FaUndo } from "react-icons/fa";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import "./order.css";
import {
  detectDataType,
  normalizeCellForType,
  generateInitialColumns,
  generateInitialRows
} from '../lib/chartUtils';

// Helper to generate a simple unique ID
const createKey = () => `id_${Date.now()}_${Math.random()}`;

export default function EnhancedDataGrid({ onSubmit, orderTypes = [], orderColors = [], setForm = () => { }, sizeChartData }) {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("Size Chart");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("number"); // Default to number for size columns
  const [newColumnPosition, setNewColumnPosition] = useState("end"); // 'start' or 'end'
  const [hasCustomChart, setHasCustomChart] = useState(false);
  const [originalColumnOrder, setOriginalColumnOrder] = useState([]);
  // Undo history stack - stores {row, index} for each deleted row
  const [undoHistory, setUndoHistory] = useState([]);
  const gridRef = useRef(null);
  const submitTimeoutRef = useRef(null);
  const lastSubmittedDataRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

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
          style={{ width: "100%", height: "100%", border: "none", padding: "4px", outline: "none", textAlign: "center" }}
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
    }),
    []
  );

  const dataTypeFormatters = useMemo(
    () => ({
      number: (props) => <div style={{ textAlign: "center", padding: "4px" }}>{props.row[props.column.key] ?? ""}</div>,
      string: (props) => (
        <div style={{ padding: "4px 8px", overflow: "hidden", textOverflow: "ellipsis" }}>{props.row[props.column.key] ?? ""}</div>
      ),
    }),
    []
  );

  const COLUMN_SUGGESTIONS = ["Size", "Quantity", "Price", "Name", "Description", "Category", "Status", "Date", "Email", "Phone", "Weight", "Color", "Material"];
  const DATA_TYPES = [
    { value: "string", label: "Text", icon: "📝" },
    { value: "number", label: "Number", icon: "🔢" },
  ];

  const deleteRow = useCallback((rowKey) => {
    setRows((prevRows) => {
      const rowIndex = prevRows.findIndex((row) => row.key === rowKey);
      if (rowIndex === -1) return prevRows;
      const deletedRow = prevRows[rowIndex];
      // Push to undo history with the row's original index
      setUndoHistory((prev) => [...prev, { row: deletedRow, index: rowIndex }]);
      return prevRows.filter((row) => row.key !== rowKey);
    });
  }, []);

  // Undo the last row deletion
  const undoRowDelete = useCallback(() => {
    if (undoHistory.length === 0) return;
    setUndoHistory((prev) => {
      const newHistory = [...prev];
      const lastDeleted = newHistory.pop();
      if (lastDeleted) {
        setRows((prevRows) => {
          const newRows = [...prevRows];
          // Insert at original index, or at end if index is out of bounds
          const insertIndex = Math.min(lastDeleted.index, newRows.length);
          newRows.splice(insertIndex, 0, lastDeleted.row);
          return newRows;
        });
      }
      return newHistory;
    });
  }, [undoHistory.length]);

  const deleteColumn = useCallback((key) => {
    if (key === "actions") return;
    setColumns((cols) => cols.filter((c) => c.key !== key));
    setRows((rs) =>
      rs.map((row) => {
        const newRow = { ...row };
        delete newRow[key];
        return newRow;
      })
    );
    setOriginalColumnOrder((prevOrder) => prevOrder.filter((colKey) => colKey !== key));
  }, []);

  const ActionCellRenderer = useCallback(
    ({ row }) => (
      <div className="d-flex justify-content-center align-items-center h-100">
        <Button
          variant="link"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            deleteRow(row.key);
          }}
          className="p-1 text-danger"
          style={{ border: "none", background: "none" }}
          title="Delete row"
        >
          <FaTrash />
        </Button>
      </div>
    ),
    [deleteRow]
  );

  const HeaderRenderer = useCallback(
    ({ column }) => (
      <div
        className="d-flex align-items-center justify-content-between w-100 h-100 px-2"
        style={{
          minHeight: "35px",
          backgroundColor: "#343a40",
          color: "#ffffff",
          fontWeight: "bold",
        }}
      >
        <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-center">
          <span className="fw-bold text-truncate small text-white">{column.name}</span>
          {column.dataType && (
            <Badge bg="secondary" className="small" style={{ fontSize: "8px" }}>
              {column.dataType === "number" ? "#" : "T"}
            </Badge>
          )}
        </div>
        {column.key !== "actions" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteColumn(column.key);
            }}
            className="p-1 text-danger"
            style={{ border: "none", background: "none", cursor: "pointer" }}
            title="Delete column"
          >
            <FaTimes size={10} />
          </button>
        )}
      </div>
    ),
    [deleteColumn]
  );

  const initialColumns = useMemo(
    () => generateInitialColumns(dataTypeEditors, dataTypeFormatters),
    [dataTypeEditors, dataTypeFormatters]
  );

  const generateInitialRowsWithKeys = useCallback((types, colors) => {
    return generateInitialRows(types, colors).map(row => ({ ...row, key: createKey() }));
  }, []);

  const resetToDefault = useCallback(() => {
    setColumns(initialColumns);
    setRows(generateInitialRowsWithKeys(orderTypes, orderColors));
    setFileName("");
    setHasCustomChart(false);
    setOriginalColumnOrder(["Item", "Color", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"]);
    setUndoHistory([]); // Clear undo history on reset
  }, [initialColumns, generateInitialRowsWithKeys, orderTypes, orderColors]);

  useEffect(() => {
    if ((columns.length === 0 && rows.length === 0) || !sizeChartData) {
      resetToDefault();
    }
  }, [columns.length, rows.length, resetToDefault, sizeChartData]);

  useEffect(() => {
    if (!hasCustomChart && (orderTypes.length > 0 || orderColors.length > 0)) {
      const newRows = generateInitialRowsWithKeys(orderTypes, orderColors);
      setRows(newRows);
    }
  }, [orderTypes, orderColors, hasCustomChart, generateInitialRowsWithKeys]);

  const addTypesColorRows = useCallback(() => {
    if (!hasCustomChart) return;
    const combinations = generateInitialRowsWithKeys(orderTypes, orderColors);
    const existingCombinations = new Set(rows.map((row) => `${row.Item}-${row.Color}`));
    const newRows = combinations
      .filter((combination) => !existingCombinations.has(`${combination.Item}-${combination.Color}`))
      .map((combination) => {
        const newRow = { ...combination };
        columns.forEach((col) => {
          if (!newRow.hasOwnProperty(col.key)) {
            newRow[col.key] = col.dataType === 'number' ? 0 : '';
          }
        });
        return newRow;
      });
    if (newRows.length > 0) {
      setRows((prevRows) => [...prevRows, ...newRows]);
    }
  }, [hasCustomChart, rows, columns, orderTypes, orderColors, generateInitialRowsWithKeys]);

  useEffect(() => {
    if (hasCustomChart && (orderTypes.length > 0 || orderColors.length > 0)) {
      addTypesColorRows();
    }
  }, [orderTypes, orderColors, hasCustomChart, addTypesColorRows]);

  const debouncedSubmit = useCallback(
    (result) => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      submitTimeoutRef.current = setTimeout(() => {
        const currentDataString = JSON.stringify(result);
        if (lastSubmittedDataRef.current !== currentDataString) {
          lastSubmittedDataRef.current = currentDataString;
          onSubmit?.(result);
        }
      }, 500);
    },
    [onSubmit]
  );

  const exportOrder = useMemo(() => {
    const current = columns.map(c => c.key);
    const order = [];
    originalColumnOrder.forEach(k => {
      if (current.includes(k)) order.push(k);
    });
    current.forEach(k => {
      if (!order.includes(k)) order.push(k);
    });
    return order;
  }, [originalColumnOrder, columns]);

  const numericKeysFromColumns = (cols) => cols.filter((c) => c.dataType === "number" && c.key !== "actions").map((c) => c.key);

  const calculatedResult = useMemo(() => {
    if (columns.length === 0) return null;
    const numericKeys = numericKeysFromColumns(columns);

    const columnTotals = numericKeys.reduce((acc, key) => {
      acc[key] = rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
      return acc;
    }, {});

    const overallTotal = Object.values(columnTotals).reduce((sum, total) => sum + total, 0);

    const finalResult = {};
    exportOrder.forEach((key) => {
      if (key === 'Item' || key === 'Color' || columnTotals[key] > 0) {
        const columnData = {};
        rows.forEach((row, displayIndex) => {
          const t = columns.find((c) => c.key === key)?.dataType || "string";
          columnData[displayIndex] = normalizeCellForType(row[key], t);
        });
        finalResult[key] = columnData;
      }
    });

    Object.defineProperty(finalResult, "_overall_total", { value: overallTotal, enumerable: false, writable: true });
    return finalResult;
  }, [columns, rows, exportOrder]);

  useEffect(() => {
    if (calculatedResult) {
      const overallTotal = calculatedResult._overall_total;
      setForm(prevForm => {
        const newOverallPieces = overallTotal ? overallTotal.toString() : "";
        if (prevForm.overallPieces !== newOverallPieces) {
          return {
            ...prevForm,
            overallPieces: newOverallPieces,
          };
        }
        return prevForm;
      });
    }
  }, [calculatedResult, setForm]);

  useEffect(() => {
    if (calculatedResult) {
      debouncedSubmit(calculatedResult);
    }
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, [calculatedResult, debouncedSubmit]);

  const handleFileUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setFileName(file.name);
      setHasCustomChart(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
          if (jsonData.length === 0) {
            alert("Empty file or no data found");
            return;
          }
          const headers = jsonData[0].map((h, i) => h || `Column_${i + 1}`);
          const dataRows = jsonData.slice(1);
          setOriginalColumnOrder(headers);
          const columnTypes = {};
          headers.forEach((header, colIndex) => {
            const sampleValues = dataRows.slice(0, 50).map((row) => row[colIndex]).filter(Boolean);
            if (sampleValues.length === 0) {
              columnTypes[header] = "string";
            } else {
              const typeCounts = sampleValues.reduce((acc, val) => {
                const type = detectDataType(val);
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {});
              columnTypes[header] = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
            }
          });
          const newColumns = headers.map((header) => ({
            key: header,
            name: header,
            dataType: columnTypes[header],
            editable: ((header == "Item" || header == "Color") ? false : true),
            width: getColumnWidth(columnTypes[header], header),
            renderEditCell: dataTypeEditors[columnTypes[header]],
            renderCell: dataTypeFormatters[columnTypes[header]],
          }));
          const newRows = dataRows.map((row) => {
            const rowObj = { key: createKey() };
            headers.forEach((header, colIndex) => {
              const raw = row[colIndex];
              rowObj[header] = normalizeCellForType(raw, columnTypes[header]);
            });
            return rowObj;
          });
          setColumns(newColumns);
          setRows(newRows);
          setTimeout(() => {
            addTypesColorRows();
          }, 100);
        } catch (error) {
          console.error("Error parsing file:", error);
          alert("Error parsing file. Please check the file format.");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [dataTypeEditors, dataTypeFormatters, addTypesColorRows]
  );

  const getColumnWidth = (dataType, columnName) => {
    switch (dataType) {
      case "number":
        return 80;
      default: {
        const baseWidth = Math.max(columnName.length * 12, 150);
        return Math.min(baseWidth, 300);
      }
    }
  };

  const addRow = useCallback(() => {
    if (columns.length === 0) {
      alert("Please add columns first");
      return;
    }
    const newRow = columns.reduce(
      (row, col) => {
        if (col.key !== "actions") {
          row[col.key] = col.dataType === 'number' ? 0 : '';
        }
        return row;
      },
      { key: createKey() }
    );
    setRows((prev) => [...prev, newRow]);
  }, [columns]);

  const handleAddColumn = useCallback(() => {
    if (!newColumnName.trim()) return;

    // Validate that column name is numeric (for size columns)
    const numericValue = parseFloat(newColumnName.trim());
    if (isNaN(numericValue)) {
      alert("Please enter a numeric size value (e.g., 22, 46, 48)");
      return;
    }

    const key = newColumnName.trim();
    const newColumn = {
      key,
      name: newColumnName.trim(),
      dataType: "number", // Always number for size columns
      editable: true,
      width: getColumnWidth("number", newColumnName),
      renderEditCell: dataTypeEditors["number"],
      renderCell: dataTypeFormatters["number"],
    };

    // Insert and sort columns - keep Item and Color first, then sort numeric columns
    setColumns(prev => {
      const newCols = [...prev, newColumn];
      return newCols.sort((a, b) => {
        // Item always first
        if (a.key === 'Item') return -1;
        if (b.key === 'Item') return 1;
        // Color always second
        if (a.key === 'Color') return -1;
        if (b.key === 'Color') return 1;
        // Sort numeric columns in ascending order
        const aNum = parseFloat(a.key);
        const bNum = parseFloat(b.key);
        const aIsNum = !isNaN(aNum);
        const bIsNum = !isNaN(bNum);
        if (aIsNum && bIsNum) return aNum - bNum;
        // Non-numeric columns come after numeric ones
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return a.key.localeCompare(b.key);
      });
    });

    setOriginalColumnOrder((prevOrder) => [...prevOrder, key]);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        [key]: 0, // Always number type
      }))
    );
    setNewColumnName("");
    setNewColumnPosition("end");
    setIsAddColumnOpen(false);
  }, [newColumnName, dataTypeEditors, dataTypeFormatters]);

  const onRowsChange = useCallback((newRows) => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      setRows(newRows);
    }, 16);
  }, []);

  const memoizedColumns = useMemo(() => {
    // Calculate equal width percentage
    // base columns (excluding actions which is in state but we filter it) + Total + Actions
    const visibleBaseColumns = columns.filter(c => c.key !== 'actions');
    const totalCols = visibleBaseColumns.length + 2; // + Total column + Actions column
    const colWidth = `${(100 / totalCols).toFixed(4)}%`;

    const numericKeys = numericKeysFromColumns(columns);
    const baseColumns = visibleBaseColumns.map(col => ({
      ...col,
      width: colWidth, // Force percentage width
      renderHeader: () => <HeaderRenderer column={col} />,
      renderSummaryCell: numericKeys.includes(col.key)
        ? (props) => (
          <div style={{ textAlign: 'center', padding: 4, fontWeight: 'bold' }}>
            {props.row[col.key]}
          </div>
        )
        : undefined,
    }));

    const totalColumn = {
      key: "_row_total",
      name: "Total",
      width: colWidth, // Force percentage width
      resizable: false,
      sortable: false,
      editable: false,
      renderCell: (props) => {
        const val = numericKeys.reduce((s, k) => s + (Number(props.row[k]) || 0), 0);
        return <div style={{ textAlign: 'center', padding: 4 }}>{val}</div>;
      },
      renderSummaryCell: (props) => (
        <div style={{ textAlign: 'center', padding: 4, fontWeight: 'bold' }}>
          {props.row._row_total}
        </div>
      )
    };

    const actionsColumn = {
      key: "actions",
      name: "Actions",
      width: colWidth, // Force percentage width
      resizable: false,
      sortable: false,
      editable: false,
      renderCell: ActionCellRenderer
    };

    return [...baseColumns, totalColumn, actionsColumn];
  }, [columns, HeaderRenderer, ActionCellRenderer]);

  const summaryRows = useMemo(() => {
    const totals = { _row_total: 0 };
    for (const row of rows) {
      for (const col of columns) {
        if (col.dataType === 'number') {
          totals[col.key] = (totals[col.key] || 0) + (Number(row[col.key]) || 0);
        }
      }
    }
    totals._row_total = numericKeysFromColumns(columns).reduce((acc, key) => acc + (totals[key] || 0), 0);
    return [totals];
  }, [rows, columns]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);


  const handlePrint = useCallback(() => {
    if (rows.length === 0) {
      alert("No data to print")
      return
    }
    const numericKeys = numericKeysFromColumns(columns)
    const displayColumns = columns.filter((c) => c.key !== "actions")

    // Build table headers
    const headerCells = displayColumns.map((c) => `<th>${c.name}</th>`).join("")
    const headerRow = `<tr>${headerCells}<th>Total</th></tr>`

    // Build data rows with row totals
    const dataRows = rows
      .map((row) => {
        const cells = displayColumns
          .map((c) => {
            const val = row[c.key] ?? ""
            return `<td>${val}</td>`
          })
          .join("")

        const rowTotal = numericKeys.reduce((s, k) => s + (Number(row[k]) || 0), 0)
        return `<tr>${cells}<td>${rowTotal}</td></tr>`
      })
      .join("")

    // Build totals row
    const totalsCells = displayColumns
      .map((c) => {
        if (c.dataType === "number") {
          const total = rows.reduce((sum, row) => sum + (Number(row[c.key]) || 0), 0)
          return `<td><strong>${total}</strong></td>`
        }
        return `<td><strong>${c.key === displayColumns[0].key ? "TOTAL" : ""}</strong></td>`
      })
      .join("")

    const overallTotal = numericKeys.reduce((acc, key) => {
      return acc + rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
    }, 0)

    const totalsRow = `<tr style="background-color: #f8f9fa; font-weight: bold;">${totalsCells}<td><strong>${overallTotal}</strong></td></tr>`

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to print")
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Data Grid</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #dee2e6;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #343a40;
              color: white;
              font-weight: bold;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h2>${fileName || "Data Grid"}</h2>
          <table>
            <thead>${headerRow}</thead>
            <tbody>${dataRows}${totalsRow}</tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [rows, columns, fileName])

  const handleExportCSV = useCallback(() => {
    if (rows.length === 0) {
      alert("No data to export")
      return
    }
    const headers = columns.filter((c) => c.key !== "actions").map((c) => c.name)
    headers.push("Total") // Add Total column header

    const csvRows = [headers.join(",")]

    // Calculate numeric columns for row totals
    const numericKeys = numericKeysFromColumns(columns)

    // Add data rows with row totals
    rows.forEach((row) => {
      const values = columns
        .filter((c) => c.key !== "actions")
        .map((c) => {
          const val = row[c.key] ?? ""
          return typeof val === "string" && val.includes(",") ? `"${val}"` : val
        })

      // Calculate row total
      const rowTotal = numericKeys.reduce((s, k) => s + (Number(row[k]) || 0), 0)
      values.push(rowTotal)

      csvRows.push(values.join(","))
    })

    // Add totals row
    const totalsRow = columns
      .filter((c) => c.key !== "actions")
      .map((c) => {
        if (c.dataType === "number") {
          return rows.reduce((sum, row) => sum + (Number(row[c.key]) || 0), 0)
        }
        return c.key === columns[0].key ? "TOTAL" : ""
      })

    // Add overall total
    const overallTotal = numericKeys.reduce((acc, key) => {
      return acc + rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
    }, 0)
    totalsRow.push(overallTotal)

    csvRows.push(totalsRow.join(","))

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = fileName || "data-export.csv"
    link.click()
  }, [rows, columns, fileName])

  const handleExportXLSX = useCallback(() => {
    if (rows.length === 0) {
      alert("No data to export")
      return
    }
    const headers = columns.filter((c) => c.key !== "actions").map((c) => c.name)
    headers.push("Total") // Add Total column header

    const numericKeys = numericKeysFromColumns(columns)

    // Add data rows with row totals
    const data = rows.map((row) => {
      const rowData = columns.filter((c) => c.key !== "actions").map((c) => row[c.key] ?? "")
      const rowTotal = numericKeys.reduce((s, k) => s + (Number(row[k]) || 0), 0)
      rowData.push(rowTotal)
      return rowData
    })

    // Add totals row
    const totalsRow = columns
      .filter((c) => c.key !== "actions")
      .map((c) => {
        if (c.dataType === "number") {
          const total = rows.reduce((sum, row) => sum + (Number(row[c.key]) || 0), 0)
          return total
        }
        return c.key === columns[0].key ? "TOTAL" : ""
      })

    // Add overall total
    const overallTotal = numericKeys.reduce((acc, key) => {
      return acc + rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
    }, 0)
    totalsRow.push(overallTotal)

    data.push(totalsRow)

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, fileName || "data-export.xlsx")
  }, [rows, columns, fileName])


  const exportToCSVFile = ({ fileName, columns, rows, order }) => {
    const aoa = buildAOA(columns, rows, order);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SizeChart");
    const csv = XLSX.write(wb, { bookType: "csv", type: "string" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  };

  const exportToXLSXFile = ({ fileName, columns, rows, order }) => {
    const aoa = buildAOA(columns, rows, order);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SizeChart");
    XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
  };

  const buildAOA = (columns, rows, order) => {
    const header = order.slice();
    const sortedRows = [...rows].sort((a, b) => a.__index - b.__index);
    const body = sortedRows.map((r) =>
      order.map((k) => {
        const t = columns.find((c) => c.key === k)?.dataType || "string";
        return normalizeCellForType(r[k], t);
      })
    );
    return [header, ...body];
  };

  return (
    <div style={{ padding: "20px", maxWidth: "100%", overflow: "auto" }} className="orderChart vfx-fade">
      <div className="d-flex gap-2 mb-3 flex-wrap justify-content-between">
        <div className="d-flex gap-2 flex-wrap">
          {/* <div className="position-relative">
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
              Upload
            </Button>
          </div>

          <Button onClick={addRow} variant="outline-success" size="sm">
            <FaPlus className="me-1" />
            Add Row
          </Button> */}

          <Button onClick={() => setIsAddColumnOpen(true)} variant="outline-info" size="sm">
            <FaPlus className="me-1" />
            Add Column
          </Button>

          {undoHistory.length > 0 && (
            <Button onClick={undoRowDelete} variant="outline-warning" size="sm" title="Undo last row deletion (Ctrl+Z style)">
              <FaUndo className="me-1" />
              Undo ({undoHistory.length})
            </Button>
          )}

          {hasCustomChart && (
            <Button onClick={resetToDefault} variant="outline-danger" size="sm">
              <FaUndo className="me-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline-secondary" size="sm">
            <FaFileCsv className="me-1" />
            CSV
          </Button>
          {/* <Button onClick={handleExportXLSX} variant="outline-secondary" size="sm">
            <FaFileExcel className="me-1" />
            Excel
          </Button>
          <Button onClick={handlePrint} variant="outline-dark" size="sm">
      <span title="For best results, disable Headers/Footers and enable Background Graphics in the print dialog.">
        <FaPrint className="me-1" />
        Print
      </span>
          </Button> */}
        </div>
      </div>

      {columns.length > 0 && (
        <div className="border rounded" style={{ backgroundColor: "#f8f9fa" }}>
          <div ref={gridRef} style={{ width: "100%" }}>
            <DataGrid
              columns={memoizedColumns}
              rows={rows}
              onRowsChange={onRowsChange}
              rowKeyGetter={(row) => row.key}
              bottomSummaryRows={summaryRows}
              className="rdg-light"
              style={{
                "--rdg-header-background-color": "#343a40",
                "--rdg-header-foreground-color": "#ffffff",
                "--rdg-border-color": "#dee2e6",
                fontSize: "13px",
                "--col-count": memoizedColumns.length
              }}
            />
          </div>
        </div>
      )}

      <Modal show={isAddColumnOpen} onHide={() => setIsAddColumnOpen(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaPlus className="me-2" />
            Add Size Column
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Size Number</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter size number (e.g., 22, 46, 48)"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              min="1"
              step="1"
            />
            <Form.Text className="text-muted">
              Enter a numeric size value. The column will be automatically sorted in ascending order.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setIsAddColumnOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddColumn} disabled={!newColumnName.trim()}>
            Add Size Column
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}