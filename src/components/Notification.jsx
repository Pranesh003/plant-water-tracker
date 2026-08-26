export default function Notification({ message }) {
  return <div role="status" className={`notification ${message ? "show" : ""}`}>{message}</div>;
}
