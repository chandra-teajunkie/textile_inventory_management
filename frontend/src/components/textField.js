// src/components/fields/TextField.jsx
export default function TextField({ label, value, onChange, placeholder, multiline = false }) {
  return (
    <div className="mb-4 rowTextfieldFlex">
      <label className="block font-medium mb-1">{label}</label>
      {multiline ? (
        <textarea
          className="border p-2 rounded w-full min-h-[100px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className="border p-2 rounded w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
