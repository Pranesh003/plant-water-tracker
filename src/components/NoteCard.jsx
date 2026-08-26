import { MessageSquare } from "lucide-react";
import { formatDate } from "../utils/wateringUtils.js";

export default function NoteCard({ note }) {
  return <article className="note-card"><MessageSquare size={18} /><div><p>{note.text}</p><small>{formatDate(note.date)} · {note.time}</small></div></article>;
}
