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
 * Format date in Indonesian short style (e.g. "16 Okt 2026")
 */
export function formatDateIndo(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
