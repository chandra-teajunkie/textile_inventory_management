
import { parseJsonSafe } from "./jsonUtils"
import { generatePrintCSS } from "./themeUtils"

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
        ${generatePrintCSS()}
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
