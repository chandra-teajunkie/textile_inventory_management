
import React from 'react';

export default function SizeChartPreview({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto mt-4">
      {console.log(data)}

      <table className="border table-auto min-w-full text-center">
        <thead className="bg-gray-100">
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th className="border px-3 py-2" key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((val, i) => (
                <td className="border px-3 py-2" key={i}>
                  {val !== null && val !== undefined ? val : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
