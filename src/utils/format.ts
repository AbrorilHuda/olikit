const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const MONTHS_FULL_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format numbers with Indonesian thousands separator (e.g. 42580 -> "42.580")
 */
export function formatNumberIndo(num: number): string {
  if (isNaN(num)) return '0';
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format km (e.g. 42580 -> "42.580 km")
 */
export function formatKm(num: number): string {
  return `${formatNumberIndo(num)} km`;
}

/**
 * Format Rupiah currency (e.g. 65000 -> "Rp 65.000")
 */
export function formatRupiah(num: number): string {
  return `Rp ${formatNumberIndo(num)}`;
}

/**
 * Parse date safely to avoid timezone shift.
 * If input is 'YYYY-MM-DD', creates a Date at local midnight.
 */
export function parseLocalDate(dateInput: Date | string): Date {
  if (dateInput instanceof Date) return dateInput;
  if (!dateInput || typeof dateInput !== 'string') return new Date();

  const trimmed = dateInput.trim();
  const datePart = trimmed.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Format a Date object as a local YYYY-MM-DD string without UTC shift.
 */
export function formatLocalDateToYMD(dateInput: Date | string): string {
  const d = parseLocalDate(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date in Indonesian short style (e.g. "16 Okt 2026")
 */
export function formatDateIndo(dateInput: Date | string): string {
  const d = parseLocalDate(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = MONTHS_SHORT_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date in Indonesian full style (e.g. "16 Oktober 2026")
 */
export function formatDateFullIndo(dateInput: Date | string): string {
  const d = parseLocalDate(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = MONTHS_FULL_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Parse Indonesian formatted number string like "42.580" back to number
 */
export function parseIndoNumber(str: string): number {
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}
