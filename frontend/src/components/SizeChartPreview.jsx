
import React from 'react';

export default function SizeChartPreview({ data, csvHeader }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto mt-4">
      {console.log(data)}

      <table className="border table-auto min-w-full text-center w-full">
        <thead className="bg-gray-100">
          <tr>
            {csvHeader.map((key) => (
              <th className="border px-3 py-2" key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {csvHeader.map((val, i) => (
                <td className="border px-3 py-2" key={i}>
                  {row[val] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
