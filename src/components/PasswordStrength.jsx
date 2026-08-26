import { Check, X } from "lucide-react";
import { evaluatePasswordStrength } from "../utils/passwordUtils.js";

const labels = {
  length: "At least 8 characters",
  upper: "Uppercase letter",
  lower: "Lowercase letter",
  number: "Number",
  special: "Special character"
};

export default function PasswordStrength({ password, identity = "", showChecklist = true }) {
  const result = evaluatePasswordStrength(password, identity);
  return (
    <div className={`password-strength ${result.className}`}>
      <p>Password strength: <strong>{result.label}</strong></p>
      {result.similar && <small>Avoid using your username or name as your password.</small>}
      {showChecklist && (
        <ul>
          {Object.entries(result.checks).map(([key, passed]) => (
            <li key={key} className={passed ? "passed" : ""}>{passed ? <Check size={14} /> : <X size={14} />} {labels[key]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
