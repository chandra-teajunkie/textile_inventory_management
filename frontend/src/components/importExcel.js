// src/components/ImportFile.jsx
import * as XLSX from 'xlsx';

export default function ImportFile({ onDataImported, onFileSelected }) {
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        onFileSelected(file); // 🔥 Save file to state

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            onDataImported(jsonData);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="my-4">
            <label className="block font-semibold mb-1">Import Size Chart (CSV/Excel)</label>
            <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFile}
                className="border p-2 rounded w-full"
            />
        </div>
    );
}
