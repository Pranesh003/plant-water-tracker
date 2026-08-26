const commonWeak = ["12345678", "123456", "password", "password123", "qwerty", "qwerty123", "11111111", "abcdefgh"];
const specialPattern = /[!@#$%^&*()_+\-=?]/;

export const getPasswordChecks = (password) => ({
  length: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: specialPattern.test(password)
});

export const passwordLooksLikeName = (password, identity = "") => {
  const cleanPassword = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanIdentity = identity.toLowerCase().split("@")[0].replace(/[^a-z0-9]/g, "");
  if (cleanPassword.length < 4 || cleanIdentity.length < 4) return false;
  if (cleanPassword === cleanIdentity) return true;
  return Math.abs(cleanPassword.length - cleanIdentity.length) <= 2 && (cleanPassword.includes(cleanIdentity) || cleanIdentity.includes(cleanPassword));
};

export const evaluatePasswordStrength = (password, identity = "") => {
  const checks = getPasswordChecks(password);
  const passed = Object.values(checks).filter(Boolean).length;
  const weakReason = commonWeak.includes(password.toLowerCase()) || passwordLooksLikeName(password, identity);
  if (!password || weakReason || passed <= 2) return { label: "WEAK", className: "weak", checks, isStrong: false, similar: passwordLooksLikeName(password, identity) };
  if (passed < 5) return { label: "MEDIUM", className: "medium", checks, isStrong: false, similar: false };
  return { label: "STRONG", className: "strong", checks, isStrong: true, similar: false };
};
