export default function AnalyticsCard({ title, value, subtitle }) {
  return <section className="analytics-card"><p>{title}</p><strong>{value}</strong>{subtitle && <small>{subtitle}</small>}</section>;
}
