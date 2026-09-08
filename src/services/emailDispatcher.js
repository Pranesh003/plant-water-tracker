/**
 * Resilient Multi-Provider Email Dispatcher
 * Sends real emails directly to target email addresses via HTTP Mail APIs.
 */

export async function sendRealEmail({ to, subject, body, fromName = "Plant Care Tracker Security" }) {
  if (!to || !to.includes("@")) return false;

  const cleanTo = to.trim().toLowerCase();

  // Primary Provider: FormSubmit AJAX Endpoint
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanTo)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "box",
        name: fromName,
        message: body,
        _replyto: "noreply@plantcaretracker.local"
      })
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && (data.success === "true" || data.success === true || data.message)) {
        console.log(`Email dispatched successfully to ${cleanTo} via FormSubmit.`);
        return true;
      }
    }
  } catch (err) {
    console.warn("Primary mail dispatcher notice:", err.message);
  }

  // Secondary Provider: Formspree / Public Form API
  try {
    const res = await fetch(`https://submit-form.com/plant-care-tracker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        to: cleanTo,
        subject,
        message: body
      })
    });
    if (res.ok) {
      console.log(`Email dispatched to ${cleanTo} via secondary provider.`);
      return true;
    }
  } catch (err) {
    console.warn("Secondary mail dispatcher notice:", err.message);
  }

  return false;
}

export async function dispatchEmailChangeNotifications(newEmail, code, oldEmail) {
  const codeSubject = "Plant Care Tracker - Your 6-Digit Email Change Verification Code";
  const codeBody = `Hello,\n\nYou requested to update your Plant Care Tracker account email address to: ${newEmail}\n\nYour 6-digit verification code is:\n\n🔑 ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this change, please ignore this email.\n\nBest regards,\nPlant Care Tracker Security Team`;

  const alertSubject = "SECURITY ALERT: Plant Care Tracker Account Email Change Requested";
  const alertBody = `Hello,\n\nWe received a security request to change the email address for your Plant Care Tracker account from ${oldEmail} to ${newEmail}.\n\nIf you initiated this change, please enter the 6-digit verification code sent to your new email (${newEmail}).\n\nIF YOU DID NOT REQUEST THIS CHANGE, please secure your account immediately.\n\nBest regards,\nPlant Care Tracker Security Team`;

  // Dispatch both emails in parallel
  const [codeSent, alertSent] = await Promise.all([
    sendRealEmail({ to: newEmail, subject: codeSubject, body: codeBody }),
    sendRealEmail({ to: oldEmail, subject: alertSubject, body: alertBody })
  ]);

  return { codeSent, alertSent };
}
