export default function LocationFilter({ value, onChange }) {
  const locations = ["All Plants", "Living Room", "Bedroom", "Kitchen", "Balcony", "Office", "Garden"];
  return <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Filter by location">{locations.map((item) => <option key={item}>{item}</option>)}</select>;
}
