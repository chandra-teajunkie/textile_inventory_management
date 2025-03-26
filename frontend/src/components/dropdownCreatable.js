import CreatableSelect from 'react-select/creatable';

export default function DropdownCreatable({ label, options, value, onChange }) {
  const formattedOptions = options.map((opt) => ({ label: opt, value: opt }));

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>
      <CreatableSelect
        isClearable
        options={formattedOptions}
        value={value ? { label: value, value } : null}
        onChange={(selected) => onChange(selected ? selected.value : '')}
      />
    </div>
  );
}
