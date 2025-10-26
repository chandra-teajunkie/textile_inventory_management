"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import DataGrid from "react-data-grid"
import { Button, Form, Modal, Card, Dropdown, ButtonGroup } from "react-bootstrap"
import { FaTrash, FaPlus, FaUpload, FaEdit, FaTimes, FaFileExport, FaPrint, FaUndo } from "react-icons/fa"
import "react-data-grid/lib/styles.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import { detectDataType } from '../lib/chartUtils'
import { getCurrentThemeVariables } from '../../utils/themeUtils'
import '../order/order.css';

const createKey = () => `id_${Date.now()}_${Math.random()}`;

export default function CustomChartComponent({ data, onSubmit, chartType = "chart", onResetToOrderChart, orderNotes = "", specialNotes = "" }) {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [chartNotes, setChartNotes] = useState("");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)
  const [newColumnName, setNewColumnName] = useState("")
  const [newColumnType, setNewColumnType] = useState("string")
  const [editColumnName, setEditColumnName] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const submitTimeoutRef = useRef(null)

  const dataTypeEditors = useMemo(() => ({
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
        style={{ width: "100%", height: "100%", border: "none", padding: "8px", outline: "none", textAlign: "center" }}
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
  }), []);

  const dataTypeFormatters = useMemo(() => ({
    number: (props) => <div style={{ textAlign: "center" }}>{props.row[props.column.key] ?? ""}</div>,
    string: (props) => <div style={{ padding: "8px" }}>{props.row[props.column.key] ?? ""}</div>,
  }), []);

  const COLUMN_SUGGESTIONS = ["Size", "Quantity", "Price", "Name", "Description", "Category", "Status", "Date", "Weight", "Color", "Material"];
  const DATA_TYPES = [
    { value: "string", label: "Text", icon: "📝" },
    { value: "number", label: "Number", icon: "🔢" },
  ];

  const deleteRow = useCallback((rowKey) => {
    setRows((prevRows) => prevRows.filter((row) => row.key !== rowKey));
  }, []);

  const deleteColumn = useCallback((key) => {
    setColumns(cols => cols.filter(c => c.key !== key));
    setRows(rs => rs.map(row => {
      const newRow = { ...row };
      delete newRow[key];
      return newRow;
    }));
  }, []);

  const ActionCellRenderer = useCallback(({ row }) => (
    <div className="d-flex justify-content-center align-items-center h-100">
      <Button variant="link" size="sm" onClick={() => deleteRow(row.key)} className="p-1 text-danger" style={{ border: "none", background: "none", color: "var(--accent-danger)" }} title="Delete row">
        <FaTrash />
      </Button>
    </div>
  ), [deleteRow]);

  const loadDataFromBackend = useCallback((backendData) => {
    if (!backendData || typeof backendData !== 'object' || Object.keys(backendData).length === 0) {
      setColumns([]);
      setRows([]);
      return;
    }
    // Exclude any UI-only keys such as 'chartNotes' from being treated as data columns
    const headers = Object.keys(backendData).filter(h => h !== 'chartNotes');
    const rowCount = Object.keys(backendData[headers[0]] || {}).length;

    const newRows = Array.from({ length: rowCount }, (_, index) => {
      const row = { key: createKey() };
      headers.forEach(header => {
        row[header] = backendData[header][index.toString()] ?? null;
      });
      return row;
    });

    const newColumns = headers.map(header => {
      let dataType = "string";
      const firstValue = newRows.length > 0 ? newRows[0][header] : null;
      if (firstValue !== null && firstValue !== undefined) {
        dataType = detectDataType(firstValue);
      }
      return {
        key: header, name: header, dataType, editable: ((header == "Item" || header == "Color") ? false : true),
        renderEditCell: dataTypeEditors[dataType],
        renderCell: dataTypeFormatters[dataType]
      };
    });

    setColumns(newColumns);
    setRows(newRows);
  }, [dataTypeEditors, dataTypeFormatters]);

  useEffect(() => {
    if (!isInitialized && data) {
      loadDataFromBackend(data);
      // initialize chart notes from incoming data if present
      if (data.chartNotes) setChartNotes(data.chartNotes);
      setIsInitialized(true);
    }
  }, [data, isInitialized, loadDataFromBackend]);

  const debouncedSubmit = useCallback((result) => {
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = setTimeout(() => {
      onSubmit(result);
    }, 300);
  }, [onSubmit]);

  // build result object including chartNotes
  const buildResult = useCallback(() => {
    const result = {};
    const validColumns = columns.filter(c => c.key !== 'actions');
    validColumns.forEach(col => {
      result[col.key] = {};
      rows.forEach((row, index) => {
        result[col.key][index] = row[col.key];
      });
    });
    // include chartNotes so parent receives note updates
    result.chartNotes = chartNotes;
    return result;
  }, [columns, rows, chartNotes]);

  useEffect(() => {
    if (isInitialized) {
      debouncedSubmit(buildResult());
    }
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, [buildResult, isInitialized, debouncedSubmit]);

  // when notes change, submit updated result as well
  useEffect(() => {
    if (isInitialized) {
      debouncedSubmit(buildResult());
    }
  }, [chartNotes, buildResult, isInitialized, debouncedSubmit]);

  const getSortedExportColumns = useCallback(() => {
    const cols = columns.filter(c => c.key !== 'actions');
    return cols.sort((a, b) => {
      if (a.key === 'Item') return -1;
      if (b.key === 'Item') return 1;
      if (a.key === 'Color') return -1;
      if (b.key === 'Color') return 1;
      // For numeric sizes, sort numerically, otherwise alphabetically
      const aIsNum = !isNaN(a.key);
      const bIsNum = !isNaN(b.key);
      if (aIsNum && bIsNum) return Number(a.key) - Number(b.key);
      return a.key.localeCompare(b.key);
    });
  }, [columns]);

  const exportToCSV = () => {
    const sortedColumns = getSortedExportColumns();
    const headers = sortedColumns.map(c => c.name);
    const csvRows = [headers.join(',')];
    rows.forEach(row => {
      const values = sortedColumns.map(c => JSON.stringify(row[c.key] ?? ''));
      csvRows.push(values.join(','));
    });
    // Add totals row for numeric columns
    const totals = {};
    sortedColumns.forEach(col => {
      if (col.dataType === 'number') {
        totals[col.key] = rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
      }
    });
    if (Object.keys(totals).length > 0) {
      const totalsValues = sortedColumns.map((c, i) => {
        if (c.dataType === 'number') return totals[c.key];
        // Put a label in the first non-numeric column (preferably first column)
        if (i === 0) return 'TOTAL';
        return '';
      });
      csvRows.push(totalsValues.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${chartType}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToExcel = () => {
    const sortedColumns = getSortedExportColumns();
    const exportRows = rows.map(row => {
      const exportRow = {};
      sortedColumns.forEach(col => {
        exportRow[col.name] = row[col.key];
      });
      return exportRow;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${chartType}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const sortedColumns = getSortedExportColumns();
    doc.text(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`, 14, 15);
    autoTable(doc, {
      head: [sortedColumns.map(c => c.name)],
      body: rows.map(row => sortedColumns.map(c => row[c.key] ?? '')),
      startY: 20,
      didDrawPage: (data) => {
        let y = data.cursor.y + 10;
        const addNotes = (title, notes) => {
          if (notes && notes.trim()) {
            doc.setFont(undefined, 'bold');
            doc.text(title, 14, y);
            y += 7;
            doc.setFont(undefined, 'normal');
            const splitNotes = doc.splitTextToSize(notes, 180);
            doc.text(splitNotes, 14, y);
            y += (splitNotes.length * 5) + 5;
          }
        };
        addNotes("Special Notes:", specialNotes);
        addNotes("Order Notes:", orderNotes);
        addNotes(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Notes:`, chartNotes);
      }
    });
    doc.save(`${chartType}.pdf`);
  };

  const handlePrint = () => {
    const theme = getCurrentThemeVariables();
    const sortedColumns = getSortedExportColumns();
    const headers = sortedColumns.map(c => `<th>${c.name}</th>`).join('');
    const body = rows.map(row => `<tr>${sortedColumns.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
    // compute totals for numeric columns
    const totals = {};
    sortedColumns.forEach(col => {
      if (col.dataType === 'number') {
        totals[col.key] = rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
      }
    });
    let totalsHtml = '';
    if (Object.keys(totals).length > 0) {
      totalsHtml = `<tr style="font-weight:bold;background:${theme.bgSecondary || '#f8f9fa'}">${sortedColumns.map((c, i) => {
        if (c.dataType === 'number') return `<td>${totals[c.key]}</td>`;
        if (i === 0) return `<td>TOTAL</td>`;
        return `<td></td>`;
      }).join('')}</tr>`;
    }
    let notesHtml = '';
    const addNotesHtml = (title, notes) => {
      if (notes && notes.trim()) {
        notesHtml += `<h2>${title}</h2><p>${notes.replace(/\n/g, '<br/>')}</p>`;
      }
    };
    addNotesHtml("Special Notes", specialNotes);
    addNotesHtml("Order Notes", orderNotes);
    addNotesHtml(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Notes`, chartNotes);
    const content = `<html><head>
    <style>
    table, th, td { border: 1px solid var(--border-color, #ddd); border-collapse: collapse; padding: 5px; color: var(--text-primary, #000); } 
    th { background-color: var(--accent-primary, #007bff); color: white; } 
    h2 { font-size: 14px; margin-top: 20px; color: var(--text-primary, #000); } 
    p { font-size: 12px; }
    body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 11px;
              background-color: ${theme.cardBg || '#ffffff'};
              color: ${theme.textPrimary || '#000000'};
            }
            .letterhead {
              border-bottom: 3px solid ${theme.accentPrimary || '#007bff'};
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .letterhead h1 {
              font-size: 24px;
              margin: 0 0 5px 0;
              color: ${theme.accentPrimary || '#007bff'};
            }
            .letterhead .tagline {
              font-size: 11px;
              font-weight: bold;
              color: #555;
              margin: 5px 0;
            }
            .letterhead .address {
              font-size: 10px;
              color: #666;
              line-height: 1.4;
            }
            .letterhead .ref-date {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 10px;
              font-weight: bold;
            }
            .letterhead h1 {
              display: flex;
              justify-content: center;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
              font-size: 18px;
              margin-top: 20px;
            }
            h2 {
              color: #555;
              font-size: 16px;
              margin-top: 25px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            h4 {
              color: #555;
              margin: 15px 0 5px 0;
              font-size: 14px;
            }
            .summary {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            .summary-item {
              font-weight: bold;
              padding: 10px;
              background: white;
              border-radius: 3px;
              border-left: 4px solid #007bff;
            }
            .urgent { border-left-color: #dc3545 !important; }
            .overdue { border-left-color: #fd7e14 !important; }
            .task-status-breakdown {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .task-status-breakdown h3 {
              font-size: 14px;
              margin: 0 0 10px 0;
              color: #333;
            }
            .task-status-breakdown ul {
              list-style: none;
              padding: 0;
              margin: 0;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
            }
            .task-status-breakdown li {
              background: white;
              padding: 8px 12px;
              border-radius: 3px;
              border-left: 3px solid #007bff;
            }
            .charts-section {
              margin: 30px 0;
              page-break-before: always;
            }
            .charts-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
              gap: 20px;
              margin: 20px 0;
            }
            .chart-container {
              text-align: center;
              page-break-inside: avoid;
              background: white;
              padding: 15px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px; 
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
            }
            th { 
              background-color: #007bff; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f2f2f2; 
            }
            .badge {
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
            }
            .badge-success { background-color: #28a745; color: white; }
            .badge-warning { background-color: #ffc107; color: black; }
            .badge-danger { background-color: #dc3545; color: white; }
            .badge-secondary { background-color: #6c757d; color: white; }
            .badge-primary { background-color: #007bff; color: white; }
            .badge-info { background-color: #17a2b8; color: white; }
            .overdue-row { background-color: #fff5f5 !important; }
            .urgent-row { background-color: #fef5e7 !important; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .charts-section { page-break-before: always; }
              .chart-container { break-inside: avoid; }
            }
    </style>
    </head>
    <body>
     <div class="letterhead">
            <h1>SIDHU Textiles</h1>
            <div class="tagline">MFRS: EXPORTERS OF HIGH CLASS HOSIERY & SPORTS WEARS</div>
            <div class="address">
              17/1, Near Sivan Theatre (North), I st Street<br>
              Kumaranandhapuram, TIRUPUR - 641 602.<br>
              Phone: 0421 - 2477863, 94430 31108<br>
              GSTIN: 33ACWPM6268J1ZV
            </div>
            <div class="ref-date">
              <span>Ref: ORD-${new Date().getTime()}</span>
              <span>Date: ${new Date().toLocaleDateString()}</span>
            </div>
          </div>
    <h1>${chartType.toUpperCase()} Chart</h1>
  <table><thead><tr>${headers}</tr></thead>
  <tbody>${body}${totalsHtml}</tbody></table>${notesHtml}<script>window.onload = () => window.print();</script></body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const addRow = () => {
    const newRow = { key: createKey() };
    columns.forEach(col => {
      newRow[col.key] = col.dataType === 'number' ? 0 : '';
    });
    setRows(prev => [...prev, newRow]);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    const key = newColumnName.replace(/\s+/g, "_");
    const newColumn = {
      key, name: newColumnName, dataType: newColumnType, editable: true,
      renderEditCell: dataTypeEditors[newColumnType],
      renderCell: dataTypeFormatters[newColumnType]
    };
    setColumns(prev => [...prev, newColumn]);
    setRows(rows.map(row => ({ ...row, [key]: newColumnType === 'number' ? 0 : '' })));
    setNewColumnName("");
    setNewColumnType("string");
    setIsAddColumnOpen(false);
  };

  const handleEditColumn = (columnKey) => {
    if (!editColumnName.trim() || editColumnName === columnKey) {
      setEditingColumn(null);
      return;
    }
    const newKey = editColumnName.replace(/\s+/g, "_");
    setColumns(cols => cols.map(col => (col.key === columnKey ? { ...col, key: newKey, name: editColumnName } : col)));
    setRows(rs => rs.map(row => {
      const newRow = { ...row, [newKey]: row[columnKey] };
      if (columnKey !== newKey) delete newRow[columnKey];
      return newRow;
    }));
    setEditingColumn(null);
  };

  const onRowsChange = (newRows) => {
    // const updatedRows = [...rows];

    // for (let i = 0; i < newRows.length; i++) {
    //   const oldRow = rows[i];
    //   const newRow = newRows[i];

    //   // Compare each key in the row
    //   for (const key in newRow) {
    //     if (key === "key" || key === "Item" || key === "Color") continue; // skip non-numeric or identifier fields

    //     const oldValue = parseFloat(oldRow[key]);
    //     const newValue = parseFloat(newRow[key]);

    //     // If both are numbers, check if newValue > oldValue
    //     if (!isNaN(oldValue) && !isNaN(newValue)) {
    //       if (newValue > oldValue) {
    //         alert(`❌ Value for column "${key}" cannot be increased (Old: ${oldValue}, New: ${newValue}).`);
    //         // Revert to old value
    //         newRows[i][key] = oldValue;
    //       }
    //     }
    //   }

    //   // Update the final row
    //   updatedRows[i] = newRows[i];
    // }

    // console.log("✅ Rows updated:", updatedRows);
    // setRows(updatedRows);
    setRows(newRows);
  };

  const memoizedColumns = useMemo(() => {
    const numericKeys = columns.filter(c => c.dataType === 'number').map(c => c.key);

    const sortedBaseColumns = [...columns].sort((a, b) => {
      if (a.key === 'Item') return -1;
      if (b.key === 'Item') return 1;
      if (a.key === 'Color') return -1;
      if (b.key === 'Color') return 1;
      const aIsNum = !isNaN(a.key);
      const bIsNum = !isNaN(b.key);
      if (aIsNum && bIsNum) return Number(a.key) - Number(b.key);
      return a.key.localeCompare(b.key);
    });

    const baseColumns = sortedBaseColumns.map(col => ({
      ...col,
      renderHeader: () => (
        <div className="d-flex align-items-center justify-content-between w-100 h-100 px-2" style={{ minHeight: "35px", backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
          {editingColumn === col.key ? (
            <Form.Control size="sm" value={editColumnName} onChange={e => setEditColumnName(e.target.value)} onBlur={() => handleEditColumn(col.key)} autoFocus />
          ) : (
            <>
              <div className="d-flex align-items-center gap-1" onClick={() => { setEditingColumn(col.key); setEditColumnName(col.name); }}>
                <span className="fw-bold text-truncate small">{col.name}</span>
                <FaEdit size={8} className="opacity-50" />
              </div>
              <Button variant="link" size="sm" onClick={() => deleteColumn(col.key)} className="p-0 text-danger ms-1">
                <FaTimes size={10} />
              </Button>
            </>
          )}
        </div>
      ),
      renderSummaryCell: numericKeys.includes(col.key) ? (props) => (
        <div style={{ textAlign: 'center', padding: 4, fontWeight: 'bold' }}>{props.row[col.key]}</div>
      ) : undefined,
    }));

    const totalColumn = {
      key: "_row_total", name: "Total", width: 90, resizable: false, sortable: false, editable: false,
      renderCell: (props) => {
        const val = numericKeys.reduce((s, k) => s + (Number(props.row[k]) || 0), 0);
        return <div style={{ textAlign: 'center', padding: 4 }}>{val}</div>;
      },
      renderSummaryCell: (props) => <div style={{ textAlign: 'center', padding: 4, fontWeight: 'bold' }}>{props.row._row_total}</div>
    };

    if (chartType == "incoming") {
      return [...baseColumns, totalColumn];
    }

    const actionsColumn = {
      key: "actions", name: "Actions", width: 80, resizable: false, sortable: false, editable: false,
      renderCell: ActionCellRenderer
    };
    return [...baseColumns, totalColumn, actionsColumn];
  }, [columns, editingColumn, editColumnName, deleteColumn, ActionCellRenderer]);

  const summaryRows = useMemo(() => {
    const totals = { _row_total: 0 };
    const numericKeys = columns.filter(c => c.dataType === 'number').map(c => c.key);
    for (const row of rows) {
      for (const key of numericKeys) {
        totals[key] = (totals[key] || 0) + (Number(row[key]) || 0);
      }
    }
    totals._row_total = numericKeys.reduce((acc, key) => acc + (totals[key] || 0), 0);
    return [totals];
  }, [rows, columns]);



  // handle cell edit validation (outgoing only)
  // const handleEditCellChange = (newRows, { indexes, column }) => {
  //   if (chartType !== "outgoing") return; // no editing for incoming

  //   const updatedRows = [...rows];
  //   indexes.forEach((i) => {
  //     const row = { ...updatedRows[i] };
  //     const key = column.key;

  //     if (typeof row[key] === "number") {
  //       const newValue = Number(newRows[i][key]);
  //       const originalValue = Number(backendData.chartData[i][key]);

  //       if (!isNaN(newValue)) {
  //         // Clamp to 0–originalValue range
  //         row[key] = Math.max(0, Math.min(newValue, originalValue));
  //       }
  //     }
  //     updatedRows[i] = row;
  //   });

  //   setRows(updatedRows);
  // };

  return (
    // <Card className="border-0 shadow-sm">
    //   <Card.Body className="p-3">
    <>
      <div className="d-flex justify-content-between mb-3 flex-wrap">
        <div className="d-flex gap-2 flex-wrap">
          {/* <div className="position-relative">
              <input type="file" accept=".csv,.xls,.xlsx" onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                      const wb = XLSX.read(evt.target.result, { type: "array" });
                      const ws = wb.Sheets[wb.SheetNames[0]];
                      const jsonData = XLSX.utils.sheet_to_json(ws);
                      const backendData = {};
                      if (jsonData.length > 0) {
                          const headers = Object.keys(jsonData[0]);
                          headers.forEach(header => {
                              backendData[header] = {};
                              jsonData.forEach((row, index) => {
                                  backendData[header][index] = row[header];
                              });
                          });
                          loadDataFromBackend(backendData);
                      }
                  };
                  reader.readAsArrayBuffer(file);
              }} className="position-absolute w-100 h-100 opacity-0" style={{ cursor: "pointer", zIndex: 2 }} id={`file-upload-${chartType}`} />
              <Button variant="outline-primary" size="sm" className="position-relative"><FaUpload className="me-1" />Upload</Button>
            </div>
            <Button onClick={addRow} variant="outline-success" size="sm"><FaPlus className="me-1" />Add Row</Button>
            <Button onClick={() => setIsAddColumnOpen(true)} variant="outline-info" size="sm"><FaPlus className="me-1" />Add Column</Button> */}
          {(onResetToOrderChart && (chartType === "outgoing")) && (
            <Button onClick={() => { onResetToOrderChart(); setIsInitialized(false); }} variant="outline-warning" size="sm"><FaUndo className="me-1" />Reset to Order Chart</Button>
          )}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button onClick={handlePrint} variant="outline-secondary" size="sm">
            <span title="For best results, disable Headers/Footers and enable Background Graphics in the print dialog. This ensures the printout matches the on-screen view.">
              <FaPrint className="me-1" />Print
            </span>
          </Button>
          <Button onClick={exportToCSV} variant="outline-secondary" size="sm"><FaFileExport className="me-1" />CSV</Button>
          {/* <Dropdown as={ButtonGroup}>
            <Button variant="outline-secondary" size="sm"><FaFileExport className="me-1" />Export</Button>
            <Dropdown.Toggle split variant="outline-secondary" size="sm" />
            <Dropdown.Menu>
              <Dropdown.Item onClick={exportToCSV}>CSV</Dropdown.Item>
              <Dropdown.Item onClick={exportToExcel}>Excel</Dropdown.Item>
              <Dropdown.Item onClick={exportToPDF}>PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown> */}
        </div>
      </div>

      {columns.length > 0 && (
        <DataGrid
          columns={memoizedColumns}
          rows={rows}
          onRowsChange={onRowsChange}
          rowKeyGetter={(row) => row.key}
          bottomSummaryRows={summaryRows}
          className={"rdg-light " + (chartType === "incoming" ? " rdg-no-actions" : "")}
          style={{ height: "300px", "--rdg-header-background-color": "var(--bg-tertiary)", "--rdg-border-color": "var(--border-color)", fontSize: "14px" }}
        />
      )}

      <Form.Group className="mt-3">
        <Form.Label className="fw-bold">{chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Notes</Form.Label>
        <Form.Control as="textarea" rows={2} value={chartNotes} onChange={(e) => setChartNotes(e.target.value)} placeholder={`Notes specific to this ${chartType} chart...`} />
      </Form.Group>

      {/* <Modal show={isAddColumnOpen} onHide={() => setIsAddColumnOpen(false)} centered>
          <Modal.Header closeButton className="bg-primary text-white"><Modal.Title><FaPlus className="me-2" />Add New Column</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Column Name</Form.Label>
              <Form.Select value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className="mb-2">
                <option value="">Select suggested name...</option>
                {COLUMN_SUGGESTIONS.map(name => <option key={name} value={name}>{name}</option>)}
              </Form.Select>
              <Form.Control placeholder="Or enter custom name" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Data Type</Form.Label>
              <Form.Select value={newColumnType} onChange={(e) => setNewColumnType(e.target.value)}>
                {DATA_TYPES.map(type => <option key={type.value} value={type.value}>{type.icon} {type.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setIsAddColumnOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddColumn} disabled={!newColumnName.trim()}>Add Column</Button>
          </Modal.Footer>
        </Modal> */}
    </>
    //   </Card.Body>
    // </Card>
  )
}