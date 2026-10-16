import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  calculateOilStatus,
  OilCalculationResult,
  validateNewOdometer,
} from '@/lib/oil';
import {
  deleteOilChangeDb,
  initDatabase,
  insertOdometerLogDb,
  insertOilChangeDb,
  resetDatabaseToDemo,
  updateMotorcycleDb,
  updateSettingsDb,
} from '@/services/db';
import { rescheduleNotifications } from '@/services/notifications';
import {
  Motorcycle,
  OdometerLog,
  OilChangeRecord,
  Settings,
} from '@/types/oil';

interface OilContextType {
  motorcycle: Motorcycle;
  oilChanges: OilChangeRecord[];
  odometerLogs: OdometerLog[];
  settings: Settings & { onboarded: boolean };
  oilStatus: OilCalculationResult;
  stats: {
    averageInterval: number;
    totalCost: number;
    recordCount: number;
  };
  isLoading: boolean;
  addOilChange: (
    record: Omit<OilChangeRecord, 'id' | 'kmDelta'>
  ) => Promise<OilChangeRecord>;
  updateOdometer: (
    newOdometer: number
  ) => Promise<{ success: boolean; error?: string }>;
  deleteOilChange: (id: string) => Promise<void>;
  updateMotorcycle: (
    updates: Partial<Pick<Motorcycle, 'name' | 'year'>>
  ) => Promise<void>;
  updateSettings: (
    newSettings: Partial<Settings & { onboarded: boolean }>
  ) => Promise<void>;
  completeOnboarding: (data: {
    motorcycleName?: string;
    motorcycleYear?: number;
    limitKm?: number;
    limitMonths?: number;
    currentOdometer: number;
    lastOdometer: number;
    lastDate: string;
    isEstimate: boolean;
    notificationsEnabled: boolean;
  }) => Promise<void>;
  resetToDemo: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const DEFAULT_MOTORCYCLE: Motorcycle = {
  id: 'vario-150-default',
  name: 'Honda Vario 150',
  year: 2015,
  currentOdometer: 42580,
};

const DEFAULT_SETTINGS: Settings & { onboarded: boolean } = {
  limitKm: 4000,
  limitMonths: 2,
  notificationsEnabled: true,
  onboarded: true,
};

const OilContext = createContext<OilContextType | undefined>(undefined);

export function OilProvider({ children }: { children: React.ReactNode }) {
  const [motorcycle, setMotorcycle] = useState<Motorcycle>(DEFAULT_MOTORCYCLE);
  const [oilChanges, setOilChanges] = useState<OilChangeRecord[]>([]);
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>([]);
  const [settings, setSettings] =
    useState<Settings & { onboarded: boolean }>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load from SQLite on mount
  useEffect(() => {
    let isMounted = true;
    initDatabase()
      .then((data) => {
        if (!isMounted) return;
        setMotorcycle(data.motorcycle);
        setOilChanges(data.oilChanges);
        setOdometerLogs(data.odometerLogs);
        setSettings(data.settings);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('DB initialization error:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sorted list with deltas
  const sortedChanges = useMemo(() => {
    const list = [...oilChanges].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (let i = 0; i < list.length; i++) {
      if (i < list.length - 1) {
        list[i].kmDelta = Math.max(0, list[i].odometer - list[i + 1].odometer);
      } else {
        list[i].kmDelta = 0;
      }
    }
    return list;
  }, [oilChanges]);

  // Reactive pure calculation of oil status
  const oilStatus = useMemo<OilCalculationResult>(() => {
    const lastChange = sortedChanges[0];
    const lastChangeOdometer = lastChange
      ? lastChange.odometer
      : motorcycle.currentOdometer;
    const lastChangeDate = lastChange ? lastChange.date : new Date();
    const isEstimate = lastChange ? lastChange.isEstimate : false;

    return calculateOilStatus({
      currentOdometer: motorcycle.currentOdometer,
      lastChangeOdometer,
      lastChangeDate,
      limitKm: settings.limitKm,
      limitMonths: settings.limitMonths,
      odometerLogs,
      today: new Date(),
      isEstimate,
    });
  }, [sortedChanges, motorcycle.currentOdometer, settings, odometerLogs]);

  // Reschedule local notifications on data change
  useEffect(() => {
    if (!isLoading && settings.notificationsEnabled) {
      rescheduleNotifications(oilStatus as any, settings, motorcycle.name);
    }
  }, [oilStatus, settings, isLoading, motorcycle.name]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalCost = 0;
    let intervalSum = 0;
    let intervalCount = 0;

    for (const item of sortedChanges) {
      totalCost += item.price;
      if (item.kmDelta && item.kmDelta > 0) {
        intervalSum += item.kmDelta;
        intervalCount++;
      }
    }

    const averageInterval =
      intervalCount > 0 ? Math.round(intervalSum / intervalCount) : 0;

    return {
      averageInterval,
      totalCost,
      recordCount: sortedChanges.length,
    };
  }, [sortedChanges]);

  // Add oil change
  const addOilChange = async (
    record: Omit<OilChangeRecord, 'id' | 'kmDelta'>
  ): Promise<OilChangeRecord> => {
    const saved = await insertOilChangeDb(record);
    setOilChanges((prev) => [saved, ...prev]);

    if (saved.odometer >= motorcycle.currentOdometer) {
      setMotorcycle((prev) => ({
        ...prev,
        currentOdometer: saved.odometer,
      }));
    }

    setOdometerLogs((prev) => [
      ...prev,
      {
        id: `odo-${Date.now()}`,
        date: saved.date,
        odometer: saved.odometer,
      },
    ]);

    return saved;
  };

  // Update odometer (Cek Odometer)
  const updateOdometer = async (
    newOdometer: number
  ): Promise<{ success: boolean; error?: string }> => {
    const validation = validateNewOdometer(
      motorcycle.currentOdometer,
      newOdometer
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const savedLog = await insertOdometerLogDb(newOdometer);
    setMotorcycle((prev) => ({
      ...prev,
      currentOdometer: newOdometer,
    }));
    setOdometerLogs((prev) => [...prev, savedLog]);

    return { success: true };
  };

  // Delete oil change
  const deleteOilChange = async (id: string): Promise<void> => {
    await deleteOilChangeDb(id);
    setOilChanges((prev) => prev.filter((item) => item.id !== id));
  };

  // Update motorcycle profile
  const updateMotorcycle = async (
    updates: Partial<Pick<Motorcycle, 'name' | 'year'>>
  ): Promise<void> => {
    await updateMotorcycleDb(updates);
    setMotorcycle((prev) => ({ ...prev, ...updates }));
  };

  // Update settings
  const updateSettings = async (
    newSettings: Partial<Settings & { onboarded: boolean }>
  ): Promise<void> => {
    await updateSettingsDb(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Complete onboarding
  const completeOnboarding = async (data: {
    motorcycleName?: string;
    motorcycleYear?: number;
    limitKm?: number;
    limitMonths?: number;
    currentOdometer: number;
    lastOdometer: number;
    lastDate: string;
    isEstimate: boolean;
    notificationsEnabled: boolean;
  }): Promise<void> => {
    const motoName = data.motorcycleName?.trim() || 'Honda Vario 150';
    const motoYear = data.motorcycleYear || 2015;
    const limitKm = data.limitKm || 4000;
    const limitMonths = data.limitMonths || 2;

    await updateMotorcycleDb({
      name: motoName,
      year: motoYear,
      currentOdometer: data.currentOdometer,
    });
    setMotorcycle((prev) => ({
      ...prev,
      name: motoName,
      year: motoYear,
      currentOdometer: data.currentOdometer,
    }));

    await updateSettingsDb({
      limitKm,
      limitMonths,
      notificationsEnabled: data.notificationsEnabled,
      onboarded: true,
    });
    setSettings((prev) => ({
      ...prev,
      limitKm,
      limitMonths,
      notificationsEnabled: data.notificationsEnabled,
      onboarded: true,
    }));

    const initialRecord: Omit<OilChangeRecord, 'id' | 'kmDelta'> = {
      date: data.lastDate,
      odometer: data.lastOdometer,
      oilBrand: 'AHM MPX2',
      price: 65000,
      workshop: 'AHASS',
      includesGearOil: false,
      isEstimate: data.isEstimate,
    };

    await insertOdometerLogDb(data.currentOdometer);
    const savedRecord = await insertOilChangeDb(initialRecord);
    setOilChanges([savedRecord]);
  };

  // Reset to default demo data
  const resetToDemo = async (): Promise<void> => {
    const demo = await resetDatabaseToDemo();
    setMotorcycle(demo.motorcycle);
    setOilChanges(demo.oilChanges);
    setOdometerLogs(demo.odometerLogs);
    setSettings(demo.settings);
  };

  // Reset all to clean new-user onboarding state
  const resetAllData = async (): Promise<void> => {
    await updateSettingsDb({ onboarded: false });
    setSettings((prev) => ({ ...prev, onboarded: false }));
  };

  return (
    <OilContext.Provider
      value={{
        motorcycle,
        oilChanges: sortedChanges,
        odometerLogs,
        settings,
        oilStatus,
        stats,
        isLoading,
        addOilChange,
        updateOdometer,
        deleteOilChange,
        updateMotorcycle,
        updateSettings,
        completeOnboarding,
        resetToDemo,
        resetAllData,
      }}>
      {children}
    </OilContext.Provider>
  );
}

export function useOil() {
  const ctx = useContext(OilContext);
  if (!ctx) {
    throw new Error('useOil must be used within an OilProvider');
  }
  return ctx;
}
