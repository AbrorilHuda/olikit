export type StatusType = 'aman' | 'mendekati' | 'segera_ganti';

export interface Motorcycle {
  id: string;
  name: string;
  year: number;
  currentOdometer: number;
}

export interface OilChangeRecord {
  id: string;
  date: string; // ISO date string: YYYY-MM-DD
  odometer: number;
  oilBrand: string;
  price: number;
  workshop: string;
  includesGearOil: boolean;
  isEstimate: boolean;
  notes?: string;
  kmDelta?: number; // delta compared to previous change
}

export interface OdometerLog {
  id: string;
  date: string;
  odometer: number;
}

export interface Settings {
  limitKm: number; // default 4000
  limitMonths: number; // default 2
  notificationsEnabled: boolean;
}

export interface CalculatedOilStatus {
  kmTerpakai: number;
  sisaKm: number;
  rataHarian: number;
  tanggalGanti: Date;
  tanggalGantiStr: string;
  sisaHari: number;
  persenSisa: number; // 0 to 100
  status: StatusType;
  statusLabel: string;
  isOverdue: boolean;
  overdueKm: number;
  isEstimate: boolean;
}
