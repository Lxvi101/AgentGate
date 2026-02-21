/**
 * Sanitizes HTML for Telegram's parse_mode: "HTML".
 * Telegram only supports: <b>, <strong>, <i>, <em>, <u>, <s>, <strike>, <del>,
 * <code>, <pre>, <a href="...">, <span class="tg-spoiler">, <br>
 *
 * Unsupported tags like <p>, <div>, etc. cause "can't parse entities" errors.
 */
export function sanitizeHtmlForTelegram(html: string): string {
  return (
    html
      // Replace <p> and </p> - use newlines to preserve paragraph breaks
      .replace(/<\/p>\s*/gi, "\n\n")
      .replace(/<p(?:\s[^>]*)?>/gi, "")
      // Strip <div> (unsupported)
      .replace(/<\/div>\s*/gi, "\n")
      .replace(/<div(?:\s[^>]*)?>/gi, "")
      // Normalize multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
