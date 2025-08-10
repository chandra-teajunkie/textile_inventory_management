"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { DataGrid } from "react-data-grid";
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

export default function EnhancedDataGrid({ onSubmit, orderTypes = [], orderColors = [] }) {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("string");
  const [hasCustomChart, setHasCustomChart] = useState(false);
  const [originalColumnOrder, setOriginalColumnOrder] = useState([]);
  const gridRef = useRef(null);
  const submitTimeoutRef = useRef(null);
  const lastSubmittedDataRef = useRef(null); // Added this line
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
    []
  );

  const dataTypeFormatters = useMemo(
    () => ({
      number: (props) => <div style={{ textAlign: "center", padding: "4px" }}>{props.row[props.column.key] ?? ""}</div>,
      string: (props) => (
        <div style={{ padding: "4px 8px", overflow: "hidden", textOverflow: "ellipsis" }}>{props.row[props.column.key] ?? ""}</div>
      ),
      boolean: (props) => <div style={{ textAlign: "center", padding: "4px" }}>{props.row[props.column.key] ? "✓" : "✗"}</div>,
      date: (props) => (
        <div style={{ padding: "4px", textAlign: "center" }}>
          {props.row[props.column.key] ? new Date(props.row[props.column.key]).toLocaleDateString() : ""}
        </div>
      ),
    }),
    []
  );

  const COLUMN_SUGGESTIONS = ["Size", "Quantity", "Price", "Name", "Description", "Category", "Status", "Date", "Email", "Phone", "Weight", "Color", "Material"];
  const DATA_TYPES = [
    { value: "string", label: "Text", icon: "📝" },
    { value: "number", label: "Number", icon: "🔢" },
    { value: "boolean", label: "Boolean", icon: "☑️" },
    { value: "date", label: "Date", icon: "📅" },
  ];

  const generateTypesColorCombinations = useCallback(() => {
    const combinations = [];
    const types = orderTypes.length > 0 ? orderTypes : ["Pant", "Shirt"];
    const colors = orderColors.length > 0 ? orderColors : ["Blue", "White"];
    types.forEach((type) => {
      colors.forEach((color) => {
        combinations.push({ type, color });
      });
    });
    return combinations;
  }, [orderTypes, orderColors]);

  const deleteRow = useCallback((rowIdx) => {
    setRows((prevRows) => {
      const newRows = prevRows.filter((row) => row.__index !== rowIdx);
      return newRows.map((row, idx) => ({ ...row, __index: idx }));
    });
  }, []);

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
            deleteRow(row.__index);
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
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {column.name}
          </span>
          {column.dataType && (
            <Badge bg="secondary" className="small" style={{ fontSize: "8px" }}>
              {column.dataType === "number" ? "#" : column.dataType === "string" ? "T" : column.dataType === "boolean" ? "B" : "D"}
            </Badge>
          )}
        </div>
        {column.key !== "actions" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteColumn(column.key);
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
        )}
      </div>
    ),
    [deleteColumn]
  );

  const initialColumns = useMemo(
    () => generateInitialColumns(dataTypeEditors, dataTypeFormatters, ActionCellRenderer),
    [dataTypeEditors, dataTypeFormatters, ActionCellRenderer]
  );

  const generateInitialRowsFromTypesColors = useCallback(() => {
    return generateInitialRows(orderTypes, orderColors);
  }, [orderTypes, orderColors]);

  const resetToDefault = useCallback(() => {
    setColumns(initialColumns);
    setRows(generateInitialRowsFromTypesColors());
    setFileName("");
    setHasCustomChart(false);
    setOriginalColumnOrder(["Item", "Color", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"]);
  }, [initialColumns, generateInitialRowsFromTypesColors]);

  useEffect(() => {
    if (columns.length === 0 && rows.length === 0) {
      resetToDefault();
    }
  }, [columns.length, rows.length, resetToDefault]);

  useEffect(() => {
    if (!hasCustomChart && (orderTypes.length > 0 || orderColors.length > 0)) {
      const newRows = generateInitialRowsFromTypesColors();
      setRows(newRows);
    }
  }, [orderTypes, orderColors, hasCustomChart, generateInitialRowsFromTypesColors]);

  const addTypesColorRows = useCallback(() => {
    if (!hasCustomChart) return;
    const combinations = generateTypesColorCombinations();
    const existingCombinations = new Set(rows.map((row) => `${row.Item}-${row.Color}`));
    const newRows = combinations
      .filter((combination) => !existingCombinations.has(`${combination.type}-${combination.color}`))
      .map((combination, index) => {
        const newRow = { __index: rows.length + index };
        if (columns.some((col) => col.key === "Item")) newRow.Item = combination.type;
        if (columns.some((col) => col.key === "Color")) newRow.Color = combination.color;
        columns.forEach((col) => {
          if (col.key !== "Item" && col.key !== "Color" && col.key !== "actions" && !newRow.hasOwnProperty(col.key)) {
            switch (col.dataType) {
              case "number":
                newRow[col.key] = 0;
                break;
              case "boolean":
                newRow[col.key] = false;
                break;
              case "date":
                newRow[col.key] = new Date().toISOString().split("T")[0];
                break;
              default:
                newRow[col.key] = "";
            }
          }
        });
        return newRow;
      });
    if (newRows.length > 0) {
      setRows((prevRows) => {
        const combinedRows = [...prevRows, ...newRows];
        return combinedRows.map((row, index) => ({ ...row, __index: index }));
      });
    }
  }, [hasCustomChart, generateTypesColorCombinations, rows, columns]);

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

  const buildExportOrder = (original, columns) => {
    const current = columns.filter((c) => c.key !== "actions").map((c) => c.key);
    const order = [];
    original.forEach((k) => {
      if (current.includes(k)) order.push(k);
    });
    current.forEach((k) => {
      if (!order.includes(k)) order.push(k);
    });
    return order;
  };

  const exportOrder = useMemo(() => buildExportOrder(originalColumnOrder, columns), [originalColumnOrder, columns]);

  const handleExportCSV = useCallback(() => {
    if (!rows.length) {
      alert("No data to export.");
      return;
    }
    const base = fileName ? fileName.replace(/\.(csv|xlsx|xls)$/i, "") : "size_chart_export";
    exportToCSVFile({ fileName: `${base}.csv`, columns, rows, order: exportOrder });
  }, [columns, rows, exportOrder, fileName]);

  const handleExportXLSX = useCallback(() => {
    if (!rows.length) {
      alert("No data to export.");
      return;
    }
    const base = fileName ? fileName.replace(/\.(csv|xlsx|xls)$/i, "") : "size_chart_export";
    exportToXLSXFile({ fileName: `${base}.xlsx`, columns, rows, order: exportOrder });
  }, [columns, rows, exportOrder, fileName]);

  const handlePrint = useCallback(() => {
    if (!rows.length) {
      alert("Nothing to print.");
      return;
    }
    const order = exportOrder;
    const sortedRows = [...rows].sort((a, b) => a.__index - b.__index);
    const html = `
      <html>
        <head>
          <title>Size Chart</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 18px; margin: 0 0 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: center; }
            th { background: #f9fafb; font-weight: 600; }
            @media print {
              @page { size: auto; margin: 12mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Size Chart</h1>
          <table>
            <thead>
              <tr>${order.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${sortedRows
        .map((r) => {
          const tds = order
            .map((k) => {
              const t = columns.find((c) => c.key === k)?.dataType || "string";
              const val = normalizeCellForType(r[k], t);
              return `<td>${val ?? ""}</td>`;
            })
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("")}
            </tbody>
          </table>
          <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 100); };</script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }, [columns, rows, exportOrder]);




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

  const calculatedResult = useMemo(() => {
    if (columns.length === 0 || rows.length === 0) return null;
    const order = exportOrder;
    const sortedRows = [...rows].sort((a, b) => a.__index - b.__index);
    const finalResult = {};
    order.forEach((columnKey) => {
      const columnData = {};
      sortedRows.forEach((row, displayIndex) => {
        const t = columns.find((c) => c.key === columnKey)?.dataType || "string";
        columnData[displayIndex] = normalizeCellForType(row[columnKey], t);
      });
      Object.defineProperty(finalResult, columnKey, {
        value: columnData,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    });
    return finalResult;
  }, [columns, rows, exportOrder]);

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
            const sampleValues = dataRows
              .slice(0, Math.min(50, dataRows.length))
              .map((row) => row[colIndex])
              .filter((val) => val !== null && val !== undefined && val !== "");
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
            editable: true,
            width: getColumnWidth(columnTypes[header], header),
            renderEditCell: dataTypeEditors[columnTypes[header]],
            renderCell: dataTypeFormatters[columnTypes[header]],
          }));
          newColumns.push({ key: "actions", name: "Actions", width: 80, resizable: false, sortable: false, renderCell: ActionCellRenderer });
          const newRows = dataRows.map((row, idx) => {
            const rowObj = { __index: idx };
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
    [dataTypeEditors, dataTypeFormatters, ActionCellRenderer, addTypesColorRows]
  );

  const getColumnWidth = (dataType, columnName) => {
    switch (dataType) {
      case "number":
        return 80;
      case "boolean":
        return 70;
      case "date":
        return 120;
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
    const today = new Date().toISOString().split("T")[0];
    const newRow = columns.reduce(
      (row, col) => {
        if (col.key === "actions") return row;
        switch (col.dataType) {
          case "string":
            row[col.key] = "";
            break;
          case "number":
            row[col.key] = 0;
            break;
          case "boolean":
            row[col.key] = false;
            break;
          case "date":
            row[col.key] = today;
            break;
          default:
            row[col.key] = "";
        }
        return row;
      },
      { __index: rows.length }
    );
    setRows((prev) => [...prev, newRow]);
  }, [columns, rows.length]);

  const handleAddColumn = useCallback(() => {
    if (!newColumnName.trim()) return;
    const key = newColumnName.replace(/\s+/g, "_");
    const newColumn = {
      key,
      name: newColumnName,
      dataType: newColumnType,
      editable: true,
      width: getColumnWidth(newColumnType, newColumnName),
      renderEditCell: dataTypeEditors[newColumnType],
      renderCell: dataTypeFormatters[newColumnType],
    };
    const newColumns = [...columns];
    const actionsIndex = newColumns.findIndex((col) => col.key === "actions");
    if (actionsIndex !== -1) newColumns.splice(actionsIndex, 0, newColumn);
    else newColumns.push(newColumn);
    setColumns(newColumns);
    setOriginalColumnOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      newOrder.splice(newOrder.length, 0, key);
      return newOrder;
    });
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
      }))
    );
    setNewColumnName("");
    setNewColumnType("string");
    setIsAddColumnOpen(false);
  }, [newColumnName, newColumnType, columns, dataTypeEditors, dataTypeFormatters]);

  const onRowsChange = useCallback((newRows) => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      setRows(newRows);
    }, 16);
  }, []);

  const memoizedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        renderHeader: () => <HeaderRenderer column={col} />,
      })),
    [columns, HeaderRenderer]
  );

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "100%", overflow: "auto" }} className="orderChart vfx-fade">
      <div className="d-flex gap-2 mb-3 flex-wrap justify-content-between">
        <div className="d-flex gap-2 flex-wrap">
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
          <Button onClick={handleExportXLSX} variant="outline-secondary" size="sm">
            <FaFileExcel className="me-1" />
            Excel
          </Button>
          <Button onClick={handlePrint} variant="outline-dark" size="sm">
            <FaPrint className="me-1" />
            Print
          </Button>
        </div>
      </div>

      {columns.length > 0 && (
        <div className="border rounded" style={{ backgroundColor: "#f8f9fa" }}>
          <div ref={gridRef} style={{ width: "100%" }}>
            <DataGrid
              columns={memoizedColumns}
              rows={rows}
              onRowsChange={onRowsChange}
              defaultColumnOptions={{ resizable: true, sortable: true }}
              rowKeyGetter={(row) => row.__index}
              style={{ "--rdg-header-foreground-color": "#ffffff", "--rdg-border-color": "#dee2e6", fontSize: "13px" }}
            />
          </div>
        </div>
      )}

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
            <Form.Control placeholder="Or enter custom name" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
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

      <div className="mt-3 text-muted">
        <small>
          <strong>Tips:</strong> Click cells to edit • Use column delete (×) buttons to remove columns • Upload CSV/Excel to import data •
          Export and Print preserve column order from your import. Numbers remain numbers; dates are YYYY-MM-DD.
        </small>
      </div>
    </div>
  );
}