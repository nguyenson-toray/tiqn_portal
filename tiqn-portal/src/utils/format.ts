/**
 * Formatting utilities — dd/MM/yyyy, tiền VND, giờ, công
 * Theo quy ước §3.2 của API Contract
 */

/** "2026-09-29" → "29/09/2026" */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/** "2026-09-29" → "29/09" */
export function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

/** "2026-09-29 10:15:00" → "10:15" */
export function formatTime(datetimeStr: string): string {
  const parts = datetimeStr.split(" ");
  if (parts.length >= 2) {
    return parts[1].substring(0, 5);
  }
  return datetimeStr.substring(0, 5);
}

/** "2026-09-29 10:15:00" → "10:15, 29/09/2026" */
export function formatDateTime(datetimeStr: string): string {
  return `${formatTime(datetimeStr)}, ${formatDate(datetimeStr.split(" ")[0])}`;
}

/** "2026-09-29 10:15:00" → "10:15, 29/09" */
export function formatDateTimeShort(datetimeStr: string): string {
  return `${formatTime(datetimeStr)}, ${formatDateShort(datetimeStr.split(" ")[0])}`;
}

/** 9150000 → "9.150.000 đ" */
export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return amount < 0 ? `−${formatted} đ` : `${formatted} đ`;
}

/** 9150000 → "9.150.000" (no suffix) */
export function formatCurrencyRaw(amount: number): string {
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return amount < 0 ? `−${formatted}` : formatted;
}

/** 24 → "24 công", 0.5 → "0,5 công" */
export function formatDays(value: number): string {
  return `${formatDecimal(value)} công`;
}

/** 8.5 → "8,5 giờ" */
export function formatHours(value: number): string {
  return `${formatDecimal(value)} giờ`;
}

/** 8.5 → "8,5" (dấu phẩy thập phân) */
export function formatDecimal(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(value % 1 === 0 ? 0 : value * 10 % 1 === 0 ? 1 : 2).replace(".", ",");
}

/** Format amount by unit */
export function formatByUnit(amount: number, unit: "VND" | "DAY" | "HOUR"): string {
  switch (unit) {
    case "VND":
      return formatCurrency(amount);
    case "DAY":
      return formatDays(amount);
    case "HOUR":
      return formatHours(amount);
  }
}

/** "2026-09" → "09/2026" */
export function formatPeriod(period: string): string {
  const [y, m] = period.split("-");
  return `${m}/${y}`;
}

/** "2026-09" → "Tháng 09/2026" */
export function formatPeriodLabel(period: string): string {
  return `Tháng ${formatPeriod(period)}`;
}

/** "2026-09-29" → "Thứ Ba" etc. */
const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
export function getWeekday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}
