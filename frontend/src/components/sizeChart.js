import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button } from 'bootstrap';

export default function SizeChart() {
    const [mode, setMode] = useState('standard');

    const [columns, setColumns] = useState([
        { header: 'Size', accessorKey: 'size', type: 'text' },
        { header: 'Quantity', accessorKey: 'quantity', type: 'number' },
    ]);

    const [data, setData] = useState([
        { size: 'S', quantity: 10 },
        { size: 'M', quantity: 20 },
        { size: 'L', quantity: 15 },
    ]);

    const updateData = (rowIndex, columnId, value) => {
        setData((old) =>
            old.map((row, index) =>
                index === rowIndex ? { ...row, [columnId]: value } : row
            )
        );
    };

    const addRow = () => {
        const newRow = {};
        columns.forEach((col) => {
            newRow[col.accessorKey] = '';
        });
        setData([...data, newRow]);
    };

    const deleteRow = (rowIndex) => {
        const newData = data.filter((_, index) => index !== rowIndex);
        setData(newData);
    };

    const addColumn = () => {
        const name = prompt('Enter column name:');
        if (!name) return;

        const type = prompt('Enter column type (text, number, date):', 'text');
        const accessorKey = name.toLowerCase().replace(/\s+/g, '_');

        const newColumn = { header: name, accessorKey, type: type || 'text' };

        setColumns([...columns, newColumn]);
        setData(data.map((row) => ({ ...row, [accessorKey]: '' })));
    };

    const deleteColumn = (accessorKey) => {
        setColumns(columns.filter((col) => col.accessorKey !== accessorKey));
        setData(data.map((row) => {
            const newRow = { ...row };
            delete newRow[accessorKey];
            return newRow;
        }));
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'SizeChart');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'size_chart.xlsx');
    };

    const exportToCSV = () => {
        const csvRows = [];
        const headers = columns.map((col) => col.header).join(',');
        csvRows.push(headers);

        for (const row of data) {
            const values = columns.map((col) => row[col.accessorKey]);
            csvRows.push(values.join(','));
        }

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        saveAs(blob, 'size_chart.csv');
    };

    const handleModeChange = (e) => {
        const selected = e.target.value;
        setMode(selected);

        if (selected === 'standard') {
            setColumns([
                { header: 'Size', accessorKey: 'size', type: 'text' },
                { header: 'Quantity', accessorKey: 'quantity', type: 'number' },
            ]);
            setData([
                { size: 'S', quantity: 10 },
                { size: 'M', quantity: 20 },
                { size: 'L', quantity: 15 },
            ]);
        } else {
            setColumns([{ header: 'Custom Col 1', accessorKey: 'col1', type: 'text' }]);
            setData([{ col1: '' }]);
        }
    };

    const handleSubmit = () => {
        console.log('Submitted Table Data:', data);
        alert('Data ready to be sent to backend (check console)');
    };

    const table = useReactTable({
        data,
        columns: columns.map((col) => ({
            ...col,
            cell: ({ getValue, row, column, table }) => {
                return (
                    <input
                        type={col.type}
                        className="border p-1 w-full cutomFieldTable"
                        defaultValue={getValue()}
                        onBlur={(e) =>
                            table.options.meta?.updateData(row.index, column.id, e.target.value)
                        }
                    />
                );
            }
            ,
        })),
        getCoreRowModel: getCoreRowModel(),
        meta: { updateData },
    });

    return (
        <div className="p-4 border rounded-md shadow-md max-w-full overflow-x-auto">
            {/* Controls */}
            <div className="flex flex-wrap gap-2 mb-4 items-center chartTitle">
                <label className="font-semibold">Table Mode:</label>
                <div className='chartOptions'>
                    <select
                        value={mode}
                        onChange={handleModeChange}
                        className="border px-2 py-1 rounded me-2"
                    >
                        <option value="standard">Standard</option>
                        <option value="custom">Custom</option>
                    </select>

                    <button onClick={addRow} className="bg-green-600 text-dark px-3 py-1 rounded me-2">Add Row</button>
                    <button onClick={addColumn} className="bg-purple-600 text-dark px-3 py-1 rounded me-2">Add Column</button>
                    <button onClick={handleSubmit} className="bg-blue-600 text-dark px-3 py-1 rounded me-2">Submit</button>
                    <button onClick={exportToExcel} className="bg-gray-700 text-dark px-3 py-1 rounded me-2">Export Excel</button>
                    <button onClick={exportToCSV} className="bg-gray-800 text-dark px-3 py-1 rounded me-2">Export CSV</button>
                </div>
            </div>

            {/* Table */}
            <table className="min-w-full table-auto border border-gray-300 sizeChartTable">
                <thead>
                    <tr>
                        {table.getHeaderGroups()[0].headers.map((header) => (
                            <th key={header.id} className="border p-2 bg-gray-100">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                <button
                                    className="ml-2 text-red-500"
                                    onClick={() => deleteColumn(header.column.id)}
                                    title="Delete Column"
                                >
                                    ❌
                                </button>
                            </th>
                        ))}
                        <th className="border p-2 bg-gray-100">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border p-1">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                            <td className="border p-1 text-center">
                                <button
                                    className="text-red-600 font-bold"
                                    onClick={() => deleteRow(row.index)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
