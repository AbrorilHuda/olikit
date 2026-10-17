import * as SQLite from 'expo-sqlite';

import {
  Motorcycle,
  OdometerLog,
  OilChangeRecord,
  Settings,
} from '@/types/oil';
import { formatLocalDateToYMD } from '@/utils/format';

const DB_NAME = 'olikit.db';

export interface DatabaseState {
  motorcycle: Motorcycle;
  oilChanges: OilChangeRecord[];
  odometerLogs: OdometerLog[];
  settings: Settings & { onboarded: boolean };
}

const DEFAULT_STATE: DatabaseState = {
  motorcycle: {
    id: 'motor-utama',
    name: 'Motor Saya',
    year: 2024,
    currentOdometer: 0,
  },
  oilChanges: [],
  odometerLogs: [],
  settings: {
    limitKm: 2500,
    limitMonths: 2,
    notificationsEnabled: true,
    onboarded: false,
  },
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDatabase(): Promise<DatabaseState> {
  try {
    const db = await getDb();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS motorcycle (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        current_odometer INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS oil_change (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        odometer INTEGER NOT NULL,
        oil_brand TEXT NOT NULL,
        price INTEGER NOT NULL,
        workshop TEXT NOT NULL,
        includes_gear_oil INTEGER NOT NULL,
        is_estimate INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS odometer_log (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        odometer INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        limit_km INTEGER NOT NULL,
        limit_months INTEGER NOT NULL,
        notifications_enabled INTEGER NOT NULL,
        onboarded INTEGER NOT NULL
      );
    `);

    // Hapus data dummy bawaan lama jika ada agar tidak merusak data pengguna
    try {
      await db.runAsync(
        "DELETE FROM oil_change WHERE id IN ('oil-1', 'oil-2', 'oil-3', 'oil-4')"
      );
      await db.runAsync(
        "DELETE FROM odometer_log WHERE id IN ('odo-1', 'odo-2', 'odo-3', 'odo-4')"
      );
      await db.runAsync(
        "DELETE FROM motorcycle WHERE id = 'vario-150-default' AND (SELECT COUNT(*) FROM oil_change) = 0"
      );
    } catch {}

    const motoRow = await db.getFirstAsync<{
      id: string;
      name: string;
      year: number;
      current_odometer: number;
    }>('SELECT * FROM motorcycle LIMIT 1');

    if (!motoRow) {
      await db.runAsync(
        'INSERT INTO motorcycle (id, name, year, current_odometer) VALUES (?, ?, ?, ?)',
        DEFAULT_STATE.motorcycle.id,
        DEFAULT_STATE.motorcycle.name,
        DEFAULT_STATE.motorcycle.year,
        DEFAULT_STATE.motorcycle.currentOdometer
      );
    }

    const settingsRow = await db.getFirstAsync<{ id: number; onboarded: number }>(
      'SELECT id, onboarded FROM settings WHERE id = 1'
    );

    if (!settingsRow) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (id, limit_km, limit_months, notifications_enabled, onboarded) VALUES (1, ?, ?, ?, ?)',
        DEFAULT_STATE.settings.limitKm,
        DEFAULT_STATE.settings.limitMonths,
        DEFAULT_STATE.settings.notificationsEnabled ? 1 : 0,
        0
      );
    }

    return await loadAllData();
  } catch (error) {
    console.warn('SQLite init error:', error);
    return DEFAULT_STATE;
  }
}

export async function loadAllData(): Promise<DatabaseState> {
  try {
    const db = await getDb();

    const moto = await db.getFirstAsync<{
      id: string;
      name: string;
      year: number;
      current_odometer: number;
    }>('SELECT * FROM motorcycle LIMIT 1');

    const settingsRow = await db.getFirstAsync<{
      limit_km: number;
      limit_months: number;
      notifications_enabled: number;
      onboarded: number;
    }>('SELECT * FROM settings WHERE id = 1');

    const oilRows = await db.getAllAsync<{
      id: string;
      date: string;
      odometer: number;
      oil_brand: string;
      price: number;
      workshop: string;
      includes_gear_oil: number;
      is_estimate: number;
    }>('SELECT * FROM oil_change ORDER BY date DESC, odometer DESC');

    const odoRows = await db.getAllAsync<{
      id: string;
      date: string;
      odometer: number;
    }>('SELECT * FROM odometer_log ORDER BY date ASC, odometer ASC');

    const motorcycle: Motorcycle = moto
      ? {
          id: moto.id,
          name: moto.name,
          year: moto.year,
          currentOdometer: moto.current_odometer,
        }
      : DEFAULT_STATE.motorcycle;

    const settings: Settings & { onboarded: boolean } = settingsRow
      ? {
          limitKm: settingsRow.limit_km,
          limitMonths: settingsRow.limit_months,
          notificationsEnabled: settingsRow.notifications_enabled === 1,
          onboarded: settingsRow.onboarded === 1,
        }
      : DEFAULT_STATE.settings;

    const oilChanges: OilChangeRecord[] = oilRows.map((r) => ({
      id: r.id,
      date: r.date,
      odometer: r.odometer,
      oilBrand: r.oil_brand,
      price: r.price,
      workshop: r.workshop,
      includesGearOil: r.includes_gear_oil === 1,
      isEstimate: r.is_estimate === 1,
    }));

    const odometerLogs: OdometerLog[] = odoRows.map((r) => ({
      id: r.id,
      date: r.date,
      odometer: r.odometer,
    }));

    return { motorcycle, oilChanges, odometerLogs, settings };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function insertOilChangeDb(
  record: Omit<OilChangeRecord, 'id' | 'kmDelta'>
): Promise<OilChangeRecord> {
  const newRecord: OilChangeRecord = {
    ...record,
    id: `oil-${Date.now()}`,
  };

  const newLog: OdometerLog = {
    id: `odo-${Date.now()}`,
    date: record.date,
    odometer: record.odometer,
  };

  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO oil_change (id, date, odometer, oil_brand, price, workshop, includes_gear_oil, is_estimate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      newRecord.id,
      newRecord.date,
      newRecord.odometer,
      newRecord.oilBrand,
      newRecord.price,
      newRecord.workshop,
      newRecord.includesGearOil ? 1 : 0,
      newRecord.isEstimate ? 1 : 0
    );

    // Otomatis menambah ke odometer_log
    await db.runAsync(
      'INSERT INTO odometer_log (id, date, odometer) VALUES (?, ?, ?)',
      newLog.id,
      newLog.date,
      newLog.odometer
    );

    // Update motorcycle current odometer if higher
    await db.runAsync(
      'UPDATE motorcycle SET current_odometer = MAX(current_odometer, ?)',
      newRecord.odometer
    );
  } catch (error) {
    console.warn('DB insert error:', error);
  }

  return newRecord;
}

export async function insertOdometerLogDb(
  newOdometer: number
): Promise<OdometerLog> {
  const todayStr = formatLocalDateToYMD(new Date());
  const newLog: OdometerLog = {
    id: `odo-${Date.now()}`,
    date: todayStr,
    odometer: newOdometer,
  };

  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO odometer_log (id, date, odometer) VALUES (?, ?, ?)',
      newLog.id,
      newLog.date,
      newLog.odometer
    );
    await db.runAsync(
      'UPDATE motorcycle SET current_odometer = ?',
      newOdometer
    );
  } catch (error) {
    console.warn('DB odo insert error:', error);
  }

  return newLog;
}

export async function deleteOilChangeDb(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM oil_change WHERE id = ?', id);
  } catch (error) {
    console.warn('DB delete error:', error);
  }
}

export async function updateMotorcycleDb(
  updates: Partial<Pick<Motorcycle, 'name' | 'year' | 'currentOdometer'>>
): Promise<void> {
  try {
    const db = await getDb();
    const current = await db.getFirstAsync<{
      id: string;
      name: string;
      year: number;
      current_odometer: number;
    }>('SELECT * FROM motorcycle LIMIT 1');

    if (!current) return;

    const name = updates.name !== undefined ? updates.name : current.name;
    const year = updates.year !== undefined ? updates.year : current.year;
    const currentOdometer =
      updates.currentOdometer !== undefined
        ? updates.currentOdometer
        : current.current_odometer;

    await db.runAsync(
      'UPDATE motorcycle SET name = ?, year = ?, current_odometer = ? WHERE id = ?',
      name,
      year,
      currentOdometer,
      current.id
    );
  } catch (error) {
    console.warn('DB update motorcycle error:', error);
  }
}

export async function updateSettingsDb(
  newSettings: Partial<Settings & { onboarded: boolean }>
): Promise<void> {
  try {
    const db = await getDb();
    const current = await db.getFirstAsync<{
      limit_km: number;
      limit_months: number;
      notifications_enabled: number;
      onboarded: number;
    }>('SELECT * FROM settings WHERE id = 1');

    const limitKm = newSettings.limitKm ?? current?.limit_km ?? 4000;
    const limitMonths = newSettings.limitMonths ?? current?.limit_months ?? 2;
    const notifEnabled =
      newSettings.notificationsEnabled !== undefined
        ? newSettings.notificationsEnabled
          ? 1
          : 0
        : current?.notifications_enabled ?? 1;
    const onboarded =
      newSettings.onboarded !== undefined
        ? newSettings.onboarded
          ? 1
          : 0
        : current?.onboarded ?? 1;

    await db.runAsync(
      'INSERT OR REPLACE INTO settings (id, limit_km, limit_months, notifications_enabled, onboarded) VALUES (1, ?, ?, ?, ?)',
      limitKm,
      limitMonths,
      notifEnabled,
      onboarded
    );
  } catch (error) {
    console.warn('DB settings update error:', error);
  }
}

export async function resetDatabaseClean(): Promise<DatabaseState> {
  try {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM motorcycle;
      DELETE FROM oil_change;
      DELETE FROM odometer_log;
      DELETE FROM settings;
    `);

    await db.runAsync(
      'INSERT INTO motorcycle (id, name, year, current_odometer) VALUES (?, ?, ?, ?)',
      DEFAULT_STATE.motorcycle.id,
      DEFAULT_STATE.motorcycle.name,
      DEFAULT_STATE.motorcycle.year,
      0
    );

    await db.runAsync(
      'INSERT INTO settings (id, limit_km, limit_months, notifications_enabled, onboarded) VALUES (1, ?, ?, ?, 0)',
      DEFAULT_STATE.settings.limitKm,
      DEFAULT_STATE.settings.limitMonths,
      DEFAULT_STATE.settings.notificationsEnabled ? 1 : 0
    );

    return await loadAllData();
  } catch {
    return DEFAULT_STATE;
  }
}

export async function resetDatabaseToDemo(): Promise<DatabaseState> {
  return await resetDatabaseClean();
}
