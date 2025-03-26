import { useState } from "react";

export default function SizeChartTable() {
  const [rows, setRows] = useState([{ size: "", quantity: "" }]);

  const addRow = () => {
    setRows([...rows, { size: "", quantity: "" }]);
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold">Size Chart</h3>
      <table className="w-full border mt-2">
        <thead>
          <tr>
            <th className="border p-2">Size</th>
            <th className="border p-2">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="border p-2">
                <input
                  type="text"
                  value={row.size}
                  onChange={(e) => updateRow(index, "size", e.target.value)}
                  className="border p-2 w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, "quantity", e.target.value)}
                  className="border p-2 w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="mt-2 bg-green-500 text-white px-4 py-2 rounded">Add Row</button>
    </div>
  );
}
