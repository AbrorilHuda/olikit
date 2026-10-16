import * as SQLite from 'expo-sqlite';

import {
  Motorcycle,
  OdometerLog,
  OilChangeRecord,
  Settings,
} from '@/types/oil';

const DB_NAME = 'olikit.db';

export interface DatabaseState {
  motorcycle: Motorcycle;
  oilChanges: OilChangeRecord[];
  odometerLogs: OdometerLog[];
  settings: Settings & { onboarded: boolean };
}

const DEFAULT_STATE: DatabaseState = {
  motorcycle: {
    id: 'vario-150-default',
    name: 'Honda Vario 150',
    year: 2015,
    currentOdometer: 42580,
  },
  oilChanges: [
    {
      id: 'oil-1',
      date: '2026-09-15',
      odometer: 39160,
      oilBrand: 'AHM MPX2',
      price: 65000,
      workshop: 'AHASS Cipete',
      includesGearOil: false,
      isEstimate: false,
      kmDelta: 3860,
    },
    {
      id: 'oil-2',
      date: '2026-05-20',
      odometer: 35300,
      oilBrand: 'AHM SPX2',
      price: 85000,
      workshop: 'AHASS Fatmawati',
      includesGearOil: true,
      isEstimate: false,
      kmDelta: 3920,
    },
    {
      id: 'oil-3',
      date: '2026-01-18',
      odometer: 31380,
      oilBrand: 'Castrol Power1',
      price: 70000,
      workshop: 'Bengkel Mandiri',
      includesGearOil: false,
      isEstimate: false,
      kmDelta: 3980,
    },
    {
      id: 'oil-4',
      date: '2025-09-10',
      odometer: 27400,
      oilBrand: 'AHM MPX2',
      price: 60000,
      workshop: 'AHASS Cipete',
      includesGearOil: false,
      isEstimate: true,
      kmDelta: 0,
    },
  ],
  odometerLogs: [
    { id: 'odo-1', date: '2026-09-15', odometer: 39160 },
    { id: 'odo-2', date: '2026-09-30', odometer: 40580 },
    { id: 'odo-3', date: '2026-10-10', odometer: 42100 },
    { id: 'odo-4', date: '2026-10-16', odometer: 42580 },
  ],
  settings: {
    limitKm: 4000,
    limitMonths: 2,
    notificationsEnabled: true,
    onboarded: true,
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

      await db.runAsync(
        'INSERT OR REPLACE INTO settings (id, limit_km, limit_months, notifications_enabled, onboarded) VALUES (1, ?, ?, ?, ?)',
        DEFAULT_STATE.settings.limitKm,
        DEFAULT_STATE.settings.limitMonths,
        DEFAULT_STATE.settings.notificationsEnabled ? 1 : 0,
        DEFAULT_STATE.settings.onboarded ? 1 : 0
      );

      for (const item of DEFAULT_STATE.oilChanges) {
        await db.runAsync(
          'INSERT INTO oil_change (id, date, odometer, oil_brand, price, workshop, includes_gear_oil, is_estimate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          item.id,
          item.date,
          item.odometer,
          item.oilBrand,
          item.price,
          item.workshop,
          item.includesGearOil ? 1 : 0,
          item.isEstimate ? 1 : 0
        );
      }

      for (const log of DEFAULT_STATE.odometerLogs) {
        await db.runAsync(
          'INSERT INTO odometer_log (id, date, odometer) VALUES (?, ?, ?)',
          log.id,
          log.date,
          log.odometer
        );
      }
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
  const todayStr = new Date().toISOString().split('T')[0];
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

export async function resetDatabaseToDemo(): Promise<DatabaseState> {
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
      DEFAULT_STATE.motorcycle.currentOdometer
    );

    await db.runAsync(
      'INSERT INTO settings (id, limit_km, limit_months, notifications_enabled, onboarded) VALUES (1, ?, ?, ?, ?)',
      DEFAULT_STATE.settings.limitKm,
      DEFAULT_STATE.settings.limitMonths,
      DEFAULT_STATE.settings.notificationsEnabled ? 1 : 0,
      1
    );

    for (const item of DEFAULT_STATE.oilChanges) {
      await db.runAsync(
        'INSERT INTO oil_change (id, date, odometer, oil_brand, price, workshop, includes_gear_oil, is_estimate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        item.id,
        item.date,
        item.odometer,
        item.oilBrand,
        item.price,
        item.workshop,
        item.includesGearOil ? 1 : 0,
        item.isEstimate ? 1 : 0
      );
    }

    for (const log of DEFAULT_STATE.odometerLogs) {
      await db.runAsync(
        'INSERT INTO odometer_log (id, date, odometer) VALUES (?, ?, ?)',
        log.id,
        log.date,
        log.odometer
      );
    }

    return await loadAllData();
  } catch {
    return DEFAULT_STATE;
  }
}
