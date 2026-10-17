/* eslint-disable @typescript-eslint/no-require-imports */
import type {
  cancelAllScheduledNotificationsAsync as CancelAllScheduledNotificationsAsyncType,
  getPermissionsAsync as GetPermissionsAsyncType,
  requestPermissionsAsync as RequestPermissionsAsyncType,
  SchedulableTriggerInputTypes as SchedulableTriggerInputTypesType,
  scheduleNotificationAsync as ScheduleNotificationAsyncType,
  setNotificationHandler as SetNotificationHandlerType,
} from 'expo-notifications';

import { CalculatedOilStatus, Settings } from '@/types/oil';

interface SafeNotificationModules {
  setNotificationHandler?: typeof SetNotificationHandlerType;
  scheduleNotificationAsync?: typeof ScheduleNotificationAsyncType;
  cancelAllScheduledNotificationsAsync?: typeof CancelAllScheduledNotificationsAsyncType;
  getPermissionsAsync?: typeof GetPermissionsAsyncType;
  requestPermissionsAsync?: typeof RequestPermissionsAsyncType;
  SchedulableTriggerInputTypes?: typeof SchedulableTriggerInputTypesType;
}

let notif: SafeNotificationModules = {};

// Safely initialize native local notifications submodules.
// Avoids importing main 'expo-notifications' barrel, which requires 'ExpoTopicSubscriptionModule'
// (a remote push module not available in Expo Go on Android).
try {
  const handler = require('expo-notifications/build/NotificationsHandler');
  const scheduler = require('expo-notifications/build/scheduleNotificationAsync');
  const canceler = require('expo-notifications/build/cancelAllScheduledNotificationsAsync');
  const permissions = require('expo-notifications/build/NotificationPermissions');
  const types = require('expo-notifications/build/Notifications.types');

  notif = {
    setNotificationHandler: handler.setNotificationHandler,
    scheduleNotificationAsync: scheduler.scheduleNotificationAsync,
    cancelAllScheduledNotificationsAsync: canceler.cancelAllScheduledNotificationsAsync,
    getPermissionsAsync: permissions.getPermissionsAsync,
    requestPermissionsAsync: permissions.requestPermissionsAsync,
    SchedulableTriggerInputTypes: types.SchedulableTriggerInputTypes,
  };

  if (notif.setNotificationHandler) {
    notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (error) {
  // Gracefully degrade when running in environments lacking native notification modules (e.g. Expo Go)
  console.warn(
    '[notifications] Local notification modules not fully available in this client. App will continue running normally.',
    error
  );
}

/**
 * Request notification permissions from user on mobile.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notif.requestPermissionsAsync || !notif.getPermissionsAsync) {
    return false;
  }
  try {
    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check if notifications are granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!notif.getPermissionsAsync) {
    return false;
  }
  try {
    const { status } = await notif.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Send an immediate test notification to verify push / local notification functionality.
 */
export async function sendTestNotification(
  vehicleName: string = 'Motor'
): Promise<{ success: boolean; message?: string }> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return {
        success: false,
        message:
          'Izin notifikasi belum diaktifkan. Mohon izinkan notifikasi pada pengaturan perangkat Anda.',
      };
    }

    if (!notif.scheduleNotificationAsync) {
      return {
        success: false,
        message: 'Modul notifikasi tidak tersedia di platform/perangkat ini.',
      };
    }

    const vehicleLabel = vehicleName.trim() || 'Motor';

    await notif.scheduleNotificationAsync({
      content: {
        title: `Tes Pengingat Oli: ${vehicleLabel}`,
        body: 'Notifikasi Olikit berfungsi dengan normal! Anda akan diingatkan saat oli motor mendekati batas ganti.',
        data: { type: 'test' },
      },
      trigger: null,
    });

    return {
      success: true,
      message: 'Notifikasi tes berhasil dikirim!',
    };
  } catch (error) {
    console.warn('Failed to send test notification:', error);
    return {
      success: false,
      message: (error as Error)?.message || 'Gagal mengirim notifikasi tes.',
    };
  }
}

/**
 * Reschedule all oil notifications based on current data.
 * Rules:
 * 1. Mendekati batas km (saat perkiraan sisa <= 300 km)
 * 2. Mendekati batas waktu (7 hari sebelum tanggal_waktu)
 * 3. Sudah lewat batas
 * 4. Pengingat perbarui odometer berkala (tiap 14 hari)
 * Aturan waktu: Dijadwalkan pukul 09:00 pagi (tidak larut malam).
 */
export async function rescheduleNotifications(
  oilStatus: CalculatedOilStatus,
  settings: Settings,
  vehicleName: string = 'Motor'
): Promise<void> {
  if (!settings.notificationsEnabled || !notif.scheduleNotificationAsync) {
    return;
  }

  try {
    // Cancel previous scheduled notifications to avoid duplicates
    if (notif.cancelAllScheduledNotificationsAsync) {
      await notif.cancelAllScheduledNotificationsAsync();
    }

    const now = new Date();
    const dateTriggerType =
      notif.SchedulableTriggerInputTypes?.DATE ?? ('date' as any);
    const vehicleLabel = vehicleName.trim() || 'Motor';

    // Helper to get trigger date set to 09:00 AM
    const setNineAM = (d: Date): Date => {
      const target = new Date(d);
      target.setHours(9, 0, 0, 0);
      return target;
    };

    // 1. Notification: Sudah lewat batas
    if (oilStatus.isOverdue) {
      const overdueDate = new Date();
      if (overdueDate.getHours() >= 9) {
        overdueDate.setDate(overdueDate.getDate() + 1);
      }
      const triggerDate = setNineAM(overdueDate);

      await notif.scheduleNotificationAsync({
        content: {
          title: `Oli Mesin ${vehicleLabel}`,
          body: 'Oli sudah melewati batas ganti. Segera lakukan penggantian oli mesin.',
          data: { type: 'overdue' },
        },
        trigger: {
          type: dateTriggerType,
          date: triggerDate,
        },
      });
    }

    // 2. Notification: Mendekati batas km (sisa <= 300 km)
    if (!oilStatus.isOverdue && oilStatus.sisaKm <= 300 && oilStatus.sisaKm > 0) {
      const targetDate = new Date();
      if (targetDate.getHours() >= 9) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      await notif.scheduleNotificationAsync({
        content: {
          title: `Oli Mesin ${vehicleLabel}`,
          body: `Oli tinggal sekitar ${oilStatus.sisaKm} km lagi. Siapkan penggantian dalam waktu dekat.`,
          data: { type: 'km_warning' },
        },
        trigger: {
          type: dateTriggerType,
          date: setNineAM(targetDate),
        },
      });
    }

    // 3. Notification: Mendekati batas waktu (7 hari sebelum tanggal_waktu)
    if (!oilStatus.isOverdue) {
      const warningTimeDate = new Date(oilStatus.tanggalGanti);
      warningTimeDate.setDate(warningTimeDate.getDate() - 7);

      if (warningTimeDate > now) {
        await notif.scheduleNotificationAsync({
          content: {
            title: `Oli Mesin ${vehicleLabel}`,
            body: 'Oli sebaiknya diganti minggu depan sesuai jadwal.',
            data: { type: 'time_warning' },
          },
          trigger: {
            type: dateTriggerType,
            date: setNineAM(warningTimeDate),
          },
        });
      }
    }

    // 4. Notification: Pengingat perbarui odometer tiap 2-3 minggu (14 hari)
    const odoReminderDate = new Date();
    odoReminderDate.setDate(odoReminderDate.getDate() + 14);

    await notif.scheduleNotificationAsync({
      content: {
        title: `Pengingat Odometer ${vehicleLabel}`,
        body: 'Perbarui odometer supaya perkiraan jadwal ganti oli tetap akurat.',
        data: { type: 'odo_reminder' },
      },
      trigger: {
        type: dateTriggerType,
        date: setNineAM(odoReminderDate),
      },
    });
  } catch (error) {
    console.warn('Failed to schedule notifications:', error);
  }
}
