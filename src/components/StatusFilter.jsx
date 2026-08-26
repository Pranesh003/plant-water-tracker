export default function StatusFilter({ value, onChange, allLabel = "All" }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Filter by status">
      <option value="All">{allLabel}</option>
      <option value="Safe">Safe</option>
      <option value="Water Soon">Needs Water</option>
      <option value="Overdue">Overdue</option>
    </select>
  );
}
