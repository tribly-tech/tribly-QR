/** Prefilled message shown when customer taps WhatsApp on the thank-you page */
export const WHATSAPP_PREFILLED_MESSAGE =
  "Keep me updated with offers, rewards, and important messages on WhatsApp.";

/**
 * Normalize phone number to digits only (for wa.me links).
 * Keeps only digits; leading + is stripped (wa.me uses digits only).
 */
export function normalizeWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits;
}

/**
 * Build WhatsApp wa.me link with prefilled message.
 * Returns empty string if number is empty or invalid.
 */
export function getWhatsAppLinkWithMessage(number: string): string {
  const cleaned = normalizeWhatsAppNumber(number);
  if (!cleaned.length) return "";
  const url = new URL("https://wa.me/" + cleaned);
  url.searchParams.set("text", WHATSAPP_PREFILLED_MESSAGE);
  return url.toString();
}

/**
 * Parse WhatsApp number from a wa.me URL (e.g. from API).
 * Returns the number part only, or null if not a valid wa.me URL.
 */
export function parseWhatsAppNumberFromUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const trimmed = url.trim();
    const match = trimmed.match(/wa\.me\/([0-9]+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
