export function EditableCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-1 px-2 border border-slate-200 rounded text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none min-w-20"
    />
  );
}
