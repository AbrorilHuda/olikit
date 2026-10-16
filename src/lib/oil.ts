import type { StatusType } from '../types/oil';

export interface OdometerLogEntry {
  date: string | Date;
  odometer: number;
}

export interface CalculateDailyAverageResult {
  rataHarian: number | null;
  hasEnoughData: boolean;
  daysRange: number;
}

export interface OilCalculationParams {
  currentOdometer: number;
  lastChangeOdometer: number;
  lastChangeDate: string | Date;
  limitKm?: number; // default 4000
  limitMonths?: number; // default 2
  odometerLogs?: OdometerLogEntry[];
  today?: Date;
  isEstimate?: boolean;
}

export interface OilCalculationResult {
  kmTerpakai: number;
  sisaKm: number;
  isOverdue: boolean;
  overdueKm: number;
  sisaKmDisplay: string;
  persenSisa: number; // 0 to 100
  status: StatusType;
  statusLabel: string;
  tanggalWaktu: Date;
  tanggalGanti: Date;
  sisaHari: number;
  rataHarian: number | null;
  hasDailyAverage: boolean;
  hasDateEstimate: boolean;
  isEstimate: boolean;
}

/**
 * Validate new odometer input against existing current odometer.
 * Rule: New odometer cannot be less than previous odometer.
 */
export function validateNewOdometer(
  currentOdometer: number,
  newOdometer: number
): { valid: boolean; error?: string } {
  if (isNaN(newOdometer) || newOdometer < 0) {
    return { valid: false, error: 'Odometer harus berupa angka positif.' };
  }
  if (newOdometer < currentOdometer) {
    return {
      valid: false,
      error: `Odometer baru (${newOdometer.toLocaleString('id-ID')} km) tidak boleh lebih kecil dari odometer sebelumnya (${currentOdometer.toLocaleString('id-ID')} km).`,
    };
  }
  return { valid: true };
}

/**
 * Calculate daily average (rata_harian) over a ~30 day window.
 * Rule from prompt:
 * - rata_harian = (odometer terbaru − odometer tertua dalam jendela ~30 hari) / jumlah hari
 * - Dipakai HANYA JIKA ada minimal 2 titik data dan rentang minimal 7 hari.
 * - Jika tidak, return hasEnoughData: false, rataHarian: null.
 */
export function calculateDailyAverage(
  logs: OdometerLogEntry[] = [],
  now: Date = new Date()
): CalculateDailyAverageResult {
  if (!logs || logs.length < 2) {
    return { rataHarian: null, hasEnoughData: false, daysRange: 0 };
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Normalize and filter logs within last ~30 days (or fallback to latest if close)
  const normalizedLogs = logs
    .map((log) => ({
      date: typeof log.date === 'string' ? new Date(log.date) : log.date,
      odometer: log.odometer,
    }))
    .filter((log) => !isNaN(log.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter within 30 days
  const recentLogs = normalizedLogs.filter((log) => log.date >= thirtyDaysAgo);
  const effectiveLogs = recentLogs.length >= 2 ? recentLogs : normalizedLogs;

  if (effectiveLogs.length < 2) {
    return { rataHarian: null, hasEnoughData: false, daysRange: 0 };
  }

  const oldest = effectiveLogs[0];
  const newest = effectiveLogs[effectiveLogs.length - 1];

  const timeDiffMs = newest.date.getTime() - oldest.date.getTime();
  const daysRange = Math.max(0, Math.round(timeDiffMs / (1000 * 60 * 60 * 24)));

  // Must have a span of at least 7 days
  if (daysRange < 7) {
    return { rataHarian: null, hasEnoughData: false, daysRange };
  }

  const kmDiff = newest.odometer - oldest.odometer;
  if (kmDiff <= 0) {
    return { rataHarian: null, hasEnoughData: false, daysRange };
  }

  const rataHarian = Math.round(kmDiff / daysRange);
  return {
    rataHarian: Math.max(1, rataHarian),
    hasEnoughData: true,
    daysRange,
  };
}

/**
 * Main Pure Calculation Function for Oil Status.
 * Adheres strictly to the specification in PRD Section 7 and the user prompt.
 */
export function calculateOilStatus(
  params: OilCalculationParams
): OilCalculationResult {
  const {
    currentOdometer,
    lastChangeOdometer,
    lastChangeDate: rawLastChangeDate,
    limitKm = 4000,
    limitMonths = 2,
    odometerLogs = [],
    today = new Date(),
    isEstimate = false,
  } = params;

  const lastChangeDate =
    typeof rawLastChangeDate === 'string'
      ? new Date(rawLastChangeDate)
      : rawLastChangeDate;

  // 1. km_terpakai = odometer_sekarang - odometer_ganti_terakhir
  const kmTerpakai = Math.max(0, currentOdometer - lastChangeOdometer);

  // 2. sisa_km = batas_km - km_terpakai
  const sisaKm = limitKm - kmTerpakai;
  const isOverdue = sisaKm <= 0;
  const overdueKm = sisaKm < 0 ? Math.abs(sisaKm) : 0;

  // Sisa km display text
  const sisaKmDisplay =
    sisaKm < 0
      ? `lewat ${overdueKm.toLocaleString('id-ID')} km`
      : `${sisaKm.toLocaleString('id-ID')} km tersisa`;

  // 3. tanggal_waktu = tanggal_ganti_terakhir + batas_bulan
  const tanggalWaktu = new Date(lastChangeDate);
  tanggalWaktu.setMonth(tanggalWaktu.getMonth() + limitMonths);

  // Difference in days for time limit
  const timeDiffMs = tanggalWaktu.getTime() - today.getTime();
  const sisaHariWaktu = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));
  const totalHariWaktu = Math.max(1, limitMonths * 30);

  // 4. persen_sisa = min(sisa_km / batas_km, sisa_hari_waktu / total_hari_waktu), dibatasi 0-100%
  const ratioKm = sisaKm / limitKm;
  const ratioTime = sisaHariWaktu / totalHariWaktu;
  const rawRatio = Math.min(ratioKm, ratioTime);
  const persenSisa = Math.max(0, Math.min(100, Math.round(rawRatio * 100)));

  // 5. Status:
  // Aman (> 30%), Mendekati (10-30%), Segera ganti (< 10% atau lewat batas)
  let status: StatusType = 'aman';
  let statusLabel = 'Aman';

  if (sisaKm <= 0 || sisaHariWaktu <= 0 || persenSisa < 10) {
    status = 'segera_ganti';
    statusLabel = 'Segera ganti';
  } else if (persenSisa <= 30) {
    status = 'mendekati';
    statusLabel = 'Mendekati';
  }

  // 6. Perkiraan tanggal
  // Dipakai HANYA JIKA ada minimal 2 titik data dan rentang minimal 7 hari.
  // Jika tidak, tampilkan sisa km saja dan pakai batas waktu untuk tanggal.
  const dailyAvg = calculateDailyAverage(odometerLogs, today);
  let tanggalGanti = tanggalWaktu;
  let sisaHari = sisaHariWaktu;
  let hasDateEstimate = false;

  if (dailyAvg.hasEnoughData && dailyAvg.rataHarian && dailyAvg.rataHarian > 0 && sisaKm > 0) {
    const sisaHariKm = Math.round(sisaKm / dailyAvg.rataHarian);
    const tanggalKm = new Date(today);
    tanggalKm.setDate(today.getDate() + sisaHariKm);

    // tanggal_ganti = min(tanggal_km, tanggal_waktu)
    if (tanggalKm < tanggalWaktu) {
      tanggalGanti = tanggalKm;
      sisaHari = sisaHariKm;
    } else {
      tanggalGanti = tanggalWaktu;
      sisaHari = sisaHariWaktu;
    }
    hasDateEstimate = true;
  } else {
    // Insufficient daily logs or overdue: use time limit directly
    tanggalGanti = tanggalWaktu;
    sisaHari = sisaHariWaktu;
    hasDateEstimate = false;
  }

  return {
    kmTerpakai,
    sisaKm,
    isOverdue,
    overdueKm,
    sisaKmDisplay,
    persenSisa,
    status,
    statusLabel,
    tanggalWaktu,
    tanggalGanti,
    sisaHari,
    rataHarian: dailyAvg.rataHarian,
    hasDailyAverage: dailyAvg.hasEnoughData,
    hasDateEstimate,
    isEstimate,
  };
}
