import { statusMeta } from "../utils/wateringUtils.js";

export default function PlantStatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.Safe;
  return <span className={`status-badge ${meta.className}`} aria-label={`Watering status ${meta.label}`}>{meta.label}</span>;
}
