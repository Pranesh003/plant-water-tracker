import { Link } from "react-router-dom";

export default function SummaryCard({ icon: Icon, label, value, tone = "green", to, action }) {
  const content = (
    <>
      <div className="summary-icon"><Icon size={22} /></div>
      <div><p>{label}</p><strong>{value}</strong>{action && <small>{action}</small>}</div>
    </>
  );

  return to ? (
    <Link className={`summary-card summary-card-link ${tone}`} to={to} aria-label={`${label}: ${value}. ${action || ""}`}>
      {content}
    </Link>
  ) : (
    <section className={`summary-card ${tone}`}>
      {content}
    </section>
  );
}
