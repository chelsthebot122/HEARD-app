// Contact details for people in your circle. They stay on this device and are only ever used to
// fill in the "Email", "Text" and "Call" buttons. HEARD never contacts anyone itself.

export function cleanEmail(raw: string): { ok: boolean; value: string; error?: string } {
  const v = raw.trim();
  if (!v) return { ok: true, value: "" };
  if (/\s/.test(v) || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)) return { ok: false, value: v, error: "That doesn't look like an email address." };
  return { ok: true, value: v };
}

/** Keeps digits and a leading +, and accepts 7 to 15 digits. */
export function cleanPhone(raw: string): { ok: boolean; value: string; error?: string } {
  const v = raw.trim();
  if (!v) return { ok: true, value: "" };
  if (/[a-z]/i.test(v)) return { ok: false, value: v, error: "Phone numbers can only have digits, spaces, dashes and a +." };
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return { ok: false, value: v, error: "That number looks too short or too long." };
  return { ok: true, value: v };
}

const MAX_HREF = 1800;

export function mailtoHref(email: string, subject: string, body: string): string | null {
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return href.length <= MAX_HREF ? href : null;
}

export function smsHref(phone: string, body: string): string | null {
  const num = phone.replace(/[^\d+]/g, "");
  const href = `sms:${num}?&body=${encodeURIComponent(body)}`;
  return href.length <= MAX_HREF ? href : null;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
