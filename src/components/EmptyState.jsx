import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({ title, message, action, to }) {
  return <section className="empty-state"><Sprout size={42} /><h3>{title}</h3><p>{message}</p>{action && <Link className="primary-btn" to={to}>{action}</Link>}</section>;
}
