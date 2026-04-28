/**
 * Format a date string to a human-readable format.
 */
export function formatDate(date: string | Date, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Truncate a string to a maximum length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize the first letter of every word in a string. (Only needed this once, but I figured it would be fun)
 */
export function capitalizeSplit(str: string): string {
  if (str.length === 0) return str;

  const result = str
      .split(/[ -]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return result;
}
