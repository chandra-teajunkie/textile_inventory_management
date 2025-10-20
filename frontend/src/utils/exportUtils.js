
import { parseJsonSafe } from "./jsonUtils"

/**
 * Converts a size chart object into a table-friendly array of arrays (AOA) with totals.
 * @param {object} sizeChart - The size chart object.
 * @returns {object} - Object containing headers, data rows, and totals.
 */
function processSizeChartData(sizeChart) {
    if (!sizeChart || typeof sizeChart !== "object" || Object.keys(sizeChart).length === 0) {
        return {
            headers: ["Item", "Color"],
            rows: [],
            columnTotals: [],
            hasData: false
        };
    }

    // Get all keys and separate size columns
    const allKeys = Object.keys(sizeChart);
    const itemColorKeys = ["Item", "Color"];
    const sizeKeys = allKeys.filter(key => !itemColorKeys.includes(key) && !key.startsWith('_'));

    // Initialize totals
    const columnTotals = {};
    sizeKeys.forEach(size => columnTotals[size] = 0);

    // Get number of rows
    const numRows = sizeChart[allKeys[0]] ? Object.keys(sizeChart[allKeys[0]]).length : 0;

    // Process rows and calculate totals
    const rows = [];
    for (let i = 0; i < numRows; i++) {
        const row = {
            item: sizeChart["Item"]?.[i] || "",
            color: sizeChart["Color"]?.[i] || "",
            sizes: {},
            total: 0
        };

        // Add size values and calculate row total
        sizeKeys.forEach(size => {
            const value = parseInt(sizeChart[size]?.[i] || 0, 10);
            row.sizes[size] = value;
            row.total += value;
            columnTotals[size] += value;
        });

        rows.push(row);
    }

    // Calculate grand total
    const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);

    return {
        headers: [...itemColorKeys, ...sizeKeys, "Total"],
        rows,
        columnTotals,
        grandTotal,
        hasData: true
    };
}

/**
 * Generates printable HTML for an order.
 * @param {object} order - The order object.
 * @param {Array<object>} tasks - The tasks associated with the order.
 * @param {boolean} includeTasks - Whether to include task details.
 * @returns {string} - The HTML content as a string.
 */
export function generatePrintableHtml(order, tasks = [], includeTasks = false) {
    const sizeChart = parseJsonSafe(order.size_chart);
    const { headers, rows, columnTotals, grandTotal, hasData } = processSizeChartData(sizeChart);
    const specialNotes = order.special_notes || "No special notes";
    const unitNotes = parseJsonSafe(order.purchase_unit_notes);
  const ref = `ORD-${new Date().getTime()}`;

    // Generate size chart HTML
    const sizeChartHtml = hasData ? `
    <table border="1" cellpadding="5" cellspacing="0" style="width:100%; margin-bottom: 20px;">
      <thead>
        <tr>
          ${headers.map(header => `<th style="background-color: #f2f2f2; text-align: center;">${header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${row.item}</td>
            <td>${row.color}</td>
            ${Object.values(row.sizes).map(value =>
        `<td style="text-align: center;">${value}</td>`
    ).join("")}
            <td style="text-align: center; font-weight: bold;">${row.total}</td>
          </tr>
        `).join("")}
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td colspan="2" style="text-align: right;">Column Total:</td>
          ${Object.values(columnTotals).map(total =>
        `<td style="text-align: center;">${total}</td>`
    ).join("")}
          <td style="text-align: center;">${grandTotal}</td>
        </tr>
      </tbody>
    </table>
  ` : '<p>No size chart data available</p>';

    let tasksHtml = "";
    if (includeTasks && tasks.length > 0) {
        tasksHtml = `
      <h2>Tasks</h2>
      <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Product</th>
            <th>Color</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(task => `
            <tr>
              <td>${task.name}</td>
              <td>${task.product}</td>
              <td>${task.color}</td>
              <td>${task.task_unit}</td>
              <td>${task.status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    }

    return `
    <html>
      <head>
        <title></title>
        <style>
          title{ display:none;, visibility:hidden; }
          body { font-family: sans-serif; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .customer-name { font-size: 1.5em; font-weight: bold; }
          .date-range { text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2 { color: #333; }
          .notes-section { margin-top: 20px; }

           body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 11px;
            }
            .letterhead {
              border-bottom: 3px solid #007bff;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .letterhead h1 {
              font-size: 24px;
              margin: 0 0 5px 0;
              color: #007bff;
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
        <div class="header">
          <div class="customer-name">Customer : ${order.customer_name}</div>
          <div class="date-range">
            <strong>Start Date:</strong> ${new Date(order.start_date).toLocaleDateString()}<br>
            <strong>Due Date:</strong> ${new Date(order.due_date).toLocaleDateString()}
          </div>
        </div>

        <h2>Size Chart</h2>
        ${sizeChartHtml}

        <div class="notes-section">
          <h2>Notes</h2>
          <h3>Special Notes</h3>
          <p>${specialNotes}</p>
          <h3>Unit Notes</h3>
          <ul>
            ${Object.entries(unitNotes).map(([unit, note]) => `<li><strong>${unit}:</strong> ${note}</li>`).join("")}
          </ul>
        </div>

        ${tasksHtml}
      </body>
    </html>
  `;
}

/**
 * Opens a new window and prints the given HTML content.
 * @param {string} htmlContent - The HTML content to print.
 */
export function printHtml(htmlContent) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for all content (especially styles) to load before printing
    printWindow.onload = function () {
        printWindow.focus();
        try {
            printWindow.print();
            // Only close after print dialog is closed
            setTimeout(() => {
                if (!printWindow.closed) {
                    printWindow.close();
                }
            }, 1000);
        } catch (error) {
            console.error('Print failed:', error);
            alert('Print failed. Please try again.');
            if (!printWindow.closed) {
                printWindow.close();
            }
        }
    };

    // Fallback if onload doesn't trigger
    setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
            printWindow.focus();
            try {
                printWindow.print();
                setTimeout(() => {
                    if (!printWindow.closed) {
                        printWindow.close();
                    }
                }, 1000);
            } catch (error) {
                console.error('Print failed (fallback):', error);
                alert('Print failed. Please try again.');
                if (!printWindow.closed) {
                    printWindow.close();
                }
            }
        }
    }, 1000);
}
