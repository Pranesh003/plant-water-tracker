import { ShieldCheck, UserRound } from "lucide-react";

export default function RoleSelector({ role, onChange }) {
  return (
    <div className="role-selector">
      <p>Sign in as</p>
      <div role="group" aria-label="Sign in role">
        <button type="button" className={role === "user" ? "selected" : ""} onClick={() => onChange("user")}><UserRound size={18} /> User</button>
        <button type="button" className={role === "admin" ? "selected" : ""} onClick={() => onChange("admin")}><ShieldCheck size={18} /> Admin</button>
      </div>
    </div>
  );
}
