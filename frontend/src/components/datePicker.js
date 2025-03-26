import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function DatePickerField({ label, value, onChange }) {
  return (
    <div className="mb-4 rowDatepickerfieldFlex">
      <label className="block font-medium mb-1">{label}</label>
      <DatePicker
        selected={value}
        onChange={onChange}
        className="border p-2 rounded w-full"
        dateFormat="yyyy-MM-dd"
      />
    </div>
  );
}
