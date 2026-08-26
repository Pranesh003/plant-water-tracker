import { Droplets, Flame, MessageSquare } from "lucide-react";
import { formatDate } from "../utils/wateringUtils.js";

export default function HistoryItem({ item }) {
  const Icon = item.type === "note" ? MessageSquare : item.type === "streak" ? Flame : Droplets;
  return <article className="history-item"><div className="history-icon"><Icon size={18} /></div><div><strong>{formatDate(item.date)}</strong><p>{item.plantName} — {item.type === "note" ? `"${item.text}"` : "Watered"}</p>{item.streak ? <small>Streak: {item.streak} days</small> : <small>{item.time}</small>}</div></article>;
}
