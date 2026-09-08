/**
 * FormSubmit Real Email Dispatcher
 * Dispatches real emails directly to target email addresses via FormSubmit AJAX service.
 */

export async function sendFormSubmitEmail({ to, subject, message }) {
  if (!to || !to.includes("@")) return false;
  const cleanTo = to.trim().toLowerCase();

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanTo)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "box",
        _captcha: "false",
        name: "Plant Care Tracker Team",
        message: message,
        _replyto: "noreply@plantcaretracker.local"
      })
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      console.log("FormSubmit email response:", data);
      return true;
    }
  } catch (err) {
    console.warn("FormSubmit email dispatch notice:", err.message);
  }
  return false;
}

export async function dispatchEmailChangeNotifications(newEmail, code, oldEmail) {
  const codeSubject = "Plant Care Tracker - Email Change Verification Code";
  const codeMessage = `Hello,\n\nYour 6-digit email change verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPlant Care Tracker Team`;

  const alertSubject = "SECURITY ALERT: Plant Care Tracker Account Email Change Requested";
  const alertMessage = `Hello,\n\nWe received a security request to change the email address for your Plant Care Tracker account from ${oldEmail} to ${newEmail}.\n\nIf you initiated this change, please enter the 6-digit verification code sent to your new email (${newEmail}).\n\nIF YOU DID NOT REQUEST THIS CHANGE, please secure your account immediately.\n\nBest regards,\nPlant Care Tracker Security Team`;

  // Dispatch emails in parallel via FormSubmit
  const [codeSent, alertSent] = await Promise.all([
    sendFormSubmitEmail({ to: newEmail, subject: codeSubject, message: codeMessage }),
    sendFormSubmitEmail({ to: oldEmail, subject: alertSubject, message: alertMessage })
  ]);

  return { codeSent, alertSent };
}
