import { useState } from 'react';
import TextField from './textField';
import DropdownCreatable from './dropdownCreatable';
import DatePickerField from './datePicker';
import SizeChartTable from './sizeChart'; // from earlier
import ImportFile from './importExcel';

export default function OrderForm() {
  const [form, setForm] = useState({
    // orderId: '',
    overallPieces: '',
    type: '',
    color: '',
    designSpec: '',
    customerId: '',
    specialNotes: '',
    orderDate: new Date(),
    startDate: new Date(),
    dueDate: new Date(),
  });

  const [sizeChartData, setSizeChartData] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);

  const [dropdownOptions] = useState({
    types: ['Top', 'Bottom', 'Pant'],
    colors: ['Red', 'Blue', 'Green'],
    specs: ['Floral', 'Plain', 'Striped'],
    customers: ['CUST001', 'CUST002', 'CUST003'],
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    Object.entries(form).forEach(([key, value]) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[key] = 'Required';
      }
    });

    const hasValidSizeChartRow = sizeChartData.some((row) =>
      Object.values(row).some((val) => val !== '')
    );

    if (!hasValidSizeChartRow) {
      newErrors.sizeChart = 'Add at least one filled row in size chart';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      alert('Please upload a Size Chart file.');
      return;
    }

    if (!validateForm()) {
      alert('Please fill all fields and upload a size chart.');
      return;
    }

    const orderPayload = {
      number_of_overall_pieces: parseInt(form.overallPieces),
      types: form.type,
      colors: form.color,
      design_specs: form.designSpec,
      customer_id: form.customerId,
      order_date: form.orderDate.toISOString(),
      start_date: form.startDate.toISOString(),
      due_date: form.dueDate.toISOString(),
      special_notes: form.specialNotes,
    };

    const formData = new FormData();
    formData.append('order', JSON.stringify(orderPayload)); // 🟡 key: order
    formData.append('size_chart_file', uploadedFile);       // 🔵 key: size_chart_file

    try {
      const response = await fetch('http://localhost:8000/orders/', {
        method: 'POST',
        body: formData,
      });

      console.log(await response.json());

      if (response.ok) {
        alert('✅ Order with size chart uploaded!');
        console.log(await response.json());
      } else {
        alert('❌ Upload failed.', `${response}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Network or server error.', `${err}`);
    }
  };


  return (
    <div className='createOrder formStyle'>
      <h1 className="text-2xl font-semibold mb-6 text-indigo-700">Order Entry</h1>
      <form className="p-6 max-w-5xl mx-auto rounded-lg shadow-md">


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* <TextField
    label="Order ID"
    value={form.orderId}
    onChange={(val) => handleChange('orderId', val)}
  /> */}
          <TextField
            label="Number of Pieces"
            value={form.overallPieces}
            onChange={(val) => handleChange('overallPieces', val)}
          />

          <DropdownCreatable
            label="Type"
            options={dropdownOptions.types}
            value={form.type}
            onChange={(val) => handleChange('type', val)}
          />
          <DropdownCreatable
            label="Color"
            options={dropdownOptions.colors}
            value={form.color}
            onChange={(val) => handleChange('color', val)}
          />

          <DropdownCreatable
            label="Design Spec"
            options={dropdownOptions.specs}
            value={form.designSpec}
            onChange={(val) => handleChange('designSpec', val)}
          />
          <DropdownCreatable
            label="Customer ID"
            options={dropdownOptions.customers}
            value={form.customerId}
            onChange={(val) => handleChange('customerId', val)}
          />

          <TextField
            label="Special Notes"
            value={form.specialNotes}
            onChange={(val) => handleChange('specialNotes', val)}
            multiline // ✅ this makes it a textarea
          />


          <DatePickerField
            label="Order Date"
            value={form.orderDate}
            onChange={(date) => handleChange('orderDate', date)}
          />
          <DatePickerField
            label="Start Date"
            value={form.startDate}
            onChange={(date) => handleChange('startDate', date)}
          />
          <DatePickerField
            label="Due Date"
            value={form.dueDate}
            onChange={(date) => handleChange('dueDate', date)}
          />
        </div>

        {errors.sizeChart && (
          <p className="text-red-500 font-medium mt-4">{errors.sizeChart}</p>
        )}

        {/* <div className="my-8">
  <h2 className="text-xl font-bold text-gray-700 mb-2">Size Chart</h2>
  <div className="overflow-x-auto">
    <SizeChartTable
      value={sizeChartData}
      onChange={(updated) => setSizeChartData(updated)}
    />
  </div>
</div> */}

        <div className="my-8">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Size Chart (View Only)</h2>

          <ImportFile
            onDataImported={setSizeChartData}
            onFileSelected={setUploadedFile}
          />


          {sizeChartData.length > 0 && (
            <div className="overflow-x-auto max-h-64 border rounded shadow">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.keys(sizeChartData[0]).map((header) => (
                      <th key={header} className="border px-4 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChartData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="border px-4 py-2">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className='flexSubmit'>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-dark px-6 py-2 rounded shadow"
          >
            Submit Order
          </button>
        </div>
      </form>
    </div>

  );
}
