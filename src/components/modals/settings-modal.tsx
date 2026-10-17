import * as Haptics from 'expo-haptics';
import { Bell, BellRing, Check, Edit3, RotateCcw, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassView } from '../ui/glass-view';
import { Radius, useAppTheme } from '@/constants/theme';
import { useOil } from '@/context/oil-context';
import { sendTestNotification } from '@/services/notifications';
import { formatNumberIndo } from '@/utils/format';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { tokens, isDark } = useAppTheme();
  const {
    settings,
    updateSettings,
    motorcycle,
    updateMotorcycle,
    resetAllData,
  } = useOil();

  const [isEditingMotor, setIsEditingMotor] = useState(false);
  const [motorName, setMotorName] = useState(motorcycle.name);
  const [motorYear, setMotorYear] = useState(motorcycle.year.toString());

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestNotification = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setIsSendingTest(true);
    setTestFeedback(null);

    const result = await sendTestNotification(motorcycle.name);
    setIsSendingTest(false);
    setTestFeedback({
      success: result.success,
      message:
        result.message ||
        (result.success
          ? 'Notifikasi tes berhasil dikirim! Silakan periksa bilah notifikasi Anda.'
          : 'Gagal mengirim notifikasi tes.'),
    });

    try {
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {}

    setTimeout(() => {
      setTestFeedback(null);
    }, 4500);
  };

  const handleStartEditMotor = () => {
    setMotorName(motorcycle.name);
    setMotorYear(motorcycle.year.toString());
    setIsEditingMotor(true);
  };

  const handleSaveMotor = async () => {
    if (!motorName.trim()) return;
    const y = parseInt(motorYear, 10);
    if (isNaN(y) || y < 1990 || y > 2035) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await updateMotorcycle({ name: motorName.trim(), year: y });
    setIsEditingMotor(false);
  };

  const KM_OPTIONS = [2000, 2500, 3000, 4000, 5000];
  const MONTH_OPTIONS = [1, 2, 3, 6];

  const isPresetKm = KM_OPTIONS.includes(settings.limitKm);
  const [isCustomKm, setIsCustomKm] = useState(!isPresetKm);
  const [customKmInput, setCustomKmInput] = useState(
    isPresetKm ? '' : settings.limitKm.toString()
  );

  const handleSelectKm = (km: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    setIsCustomKm(false);
    updateSettings({ limitKm: km });
  };

  const handleCustomKmChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setCustomKmInput(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= 500 && num <= 20000) {
      updateSettings({ limitKm: num });
    }
  };

  const handleSelectMonths = (months: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    updateSettings({ limitMonths: months });
  };

  const handleToggleNotification = (val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    updateSettings({ notificationsEnabled: val });
  };

  const handleResetClean = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // web ignore
    }
    await resetAllData();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <GlassView
          borderRadius={Radius.modal}
          variant="modal"
          intensity={70}
          style={styles.sheetContainer}
          contentStyle={styles.sheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: tokens.text }]}>
                Pengaturan
              </Text>
              <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                Konfigurasi jadwal & batas oli
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: tokens.glassFillSubtle },
              ]}>
              <X size={18} color={tokens.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Motor Info Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text
                  style={[styles.sectionTitle, { color: tokens.textMuted }]}>
                  PROFIL MOTOR
                </Text>
                {!isEditingMotor && (
                  <Pressable
                    onPress={handleStartEditMotor}
                    hitSlop={8}
                    style={styles.editBtn}>
                    <Edit3 size={13} color={tokens.accent} />
                    <Text
                      style={[styles.editBtnText, { color: tokens.accent }]}>
                      Ubah
                    </Text>
                  </Pressable>
                )}
              </View>

              {isEditingMotor ? (
                <View
                  style={[
                    styles.editForm,
                    {
                      backgroundColor: tokens.glassFill,
                      borderColor: tokens.glassBorder,
                    },
                  ]}>
                  <Text
                    style={[styles.fieldSubLabel, { color: tokens.textMuted }]}>
                    NAMA MOTOR
                  </Text>
                  <TextInput
                    value={motorName}
                    onChangeText={setMotorName}
                    style={[
                      styles.editInput,
                      {
                        color: tokens.text,
                        borderColor: tokens.glassBorder,
                        backgroundColor: tokens.glassFillSubtle,
                      },
                    ]}
                    placeholder="Contoh: Honda Vario 150"
                    placeholderTextColor={tokens.textSubtle}
                  />

                  <Text
                    style={[
                      styles.fieldSubLabel,
                      { color: tokens.textMuted, marginTop: 10 },
                    ]}>
                    TAHUN PRODUKSI
                  </Text>
                  <TextInput
                    value={motorYear}
                    onChangeText={(v) => setMotorYear(v.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={[
                      styles.editInput,
                      {
                        color: tokens.text,
                        borderColor: tokens.glassBorder,
                        backgroundColor: tokens.glassFillSubtle,
                      },
                    ]}
                    placeholder="2015"
                    placeholderTextColor={tokens.textSubtle}
                    maxLength={4}
                  />

                  <View style={styles.editActions}>
                    <Pressable
                      onPress={() => setIsEditingMotor(false)}
                      style={[
                        styles.editActionBtn,
                        {
                          backgroundColor: tokens.glassFillSubtle,
                          borderColor: tokens.glassBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.editActionBtnText,
                          { color: tokens.textMuted },
                        ]}>
                        Batal
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSaveMotor}
                      style={[
                        styles.editActionBtn,
                        { backgroundColor: tokens.accent },
                      ]}>
                      <Check size={14} color={tokens.onButton} />
                      <Text
                        style={[
                          styles.editActionBtnText,
                          { color: tokens.onButton, fontWeight: '700' },
                        ]}>
                        Simpan
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.infoRow,
                    {
                      backgroundColor: tokens.glassFill,
                      borderColor: tokens.glassBorder,
                    },
                  ]}>
                  <View>
                    <Text style={[styles.infoMain, { color: tokens.text }]}>
                      {motorcycle.name}
                    </Text>
                    <Text
                      style={[
                        styles.infoSecondary,
                        { color: tokens.textMuted },
                      ]}>
                      Tahun {motorcycle.year} • Odometer{' '}
                      {formatNumberIndo(motorcycle.currentOdometer)} km
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Limit Km Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>
                BATAS INTERVAL JARAK
              </Text>
              <View style={styles.chipRow}>
                {KM_OPTIONS.map((km) => {
                  const isSelected = !isCustomKm && settings.limitKm === km;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => handleSelectKm(km)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? tokens.chipSelected
                            : tokens.glassFill,
                          borderColor: isSelected
                            ? tokens.chipSelected
                            : tokens.glassBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? tokens.chipSelectedText
                              : tokens.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {formatNumberIndo(km)} km
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Custom Km Chip */}
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setIsCustomKm(true);
                    if (!customKmInput) {
                      setCustomKmInput(settings.limitKm.toString());
                    }
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isCustomKm
                        ? tokens.chipSelected
                        : tokens.glassFill,
                      borderColor: isCustomKm
                        ? tokens.chipSelected
                        : tokens.glassBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isCustomKm
                          ? tokens.chipSelectedText
                          : tokens.text,
                        fontWeight: isCustomKm ? '700' : '500',
                      },
                    ]}>
                    Kustom
                  </Text>
                </Pressable>
              </View>

              {/* Custom Km Input Field */}
              {isCustomKm && (
                <View
                  style={[
                    styles.customKmContainer,
                    {
                      backgroundColor: tokens.glassFill,
                      borderColor: tokens.glassBorder,
                    },
                  ]}>
                  <Text
                    style={[styles.fieldSubLabel, { color: tokens.textMuted }]}>
                    MASUKKAN TARGET KILOMETER
                  </Text>
                  <View style={styles.customKmInputRow}>
                    <TextInput
                      value={customKmInput}
                      onChangeText={handleCustomKmChange}
                      keyboardType="number-pad"
                      style={[
                        styles.customKmInput,
                        {
                          color: tokens.text,
                          backgroundColor: tokens.glassFillSubtle,
                          borderColor: tokens.glassBorder,
                        },
                      ]}
                      placeholder="Contoh: 2500"
                      placeholderTextColor={tokens.textSubtle}
                      maxLength={6}
                    />
                    <Text
                      style={[styles.customKmUnit, { color: tokens.textMuted }]}>
                      km
                    </Text>
                  </View>
                </View>
              )}

              <Text style={[styles.hintText, { color: tokens.textSubtle }]}>
                {isCustomKm
                  ? `Batas interval aktif: ${formatNumberIndo(settings.limitKm)} km.`
                  : 'Buku manual merekomendasikan 4.000 km untuk pemakaian normal.'}
              </Text>
            </View>

            {/* Limit Months Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>
                BATAS INTERVAL WAKTU
              </Text>
              <View style={styles.chipRow}>
                {MONTH_OPTIONS.map((months) => {
                  const isSelected = settings.limitMonths === months;
                  return (
                    <Pressable
                      key={months}
                      onPress={() => handleSelectMonths(months)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? tokens.chipSelected
                            : tokens.glassFill,
                          borderColor: isSelected
                            ? tokens.chipSelected
                            : tokens.glassBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? tokens.chipSelectedText
                              : tokens.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {months} Bulan
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.hintText, { color: tokens.textSubtle }]}>
                Penggantian oli sebaiknya dilakukan maksimal setiap 2 bulan.
              </Text>
            </View>

            {/* Notifications Toggle */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>
                PENGINGAT
              </Text>
              <View
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: tokens.glassFill,
                    borderColor: tokens.glassBorder,
                  },
                ]}>
                <View style={styles.toggleLeft}>
                  <Bell size={18} color={tokens.textMuted} />
                  <View>
                    <Text style={[styles.toggleTitle, { color: tokens.text }]}>
                      Notifikasi Lokal
                    </Text>
                    <Text
                      style={[
                        styles.toggleSubtitle,
                        { color: tokens.textMuted },
                      ]}>
                      Ingatkan saat sisa km &le; 300 km
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={handleToggleNotification}
                  trackColor={{
                    false: isDark ? '#2e3135' : '#d0d4dc',
                    true: tokens.accent,
                  }}
                  thumbColor={isDark ? '#ffffff' : '#ffffff'}
                />
              </View>

              {/* Test Notification Button */}
              <Pressable
                onPress={handleTestNotification}
                disabled={isSendingTest}
                style={({ pressed }) => [
                  styles.testNotifBtn,
                  {
                    backgroundColor: tokens.glassFillSubtle,
                    borderColor: tokens.glassBorder,
                    opacity: pressed || isSendingTest ? 0.7 : 1,
                  },
                ]}>
                <BellRing size={16} color={tokens.accent} />
                <Text style={[styles.testNotifBtnText, { color: tokens.text }]}>
                  {isSendingTest ? 'Mengirim notifikasi...' : 'Tes Kirim Notifikasi'}
                </Text>
              </Pressable>

              {testFeedback && (
                <View
                  style={[
                    styles.testFeedbackBox,
                    {
                      backgroundColor: testFeedback.success
                        ? tokens.accentFill
                        : tokens.statusSegeraGantiFill,
                      borderColor: testFeedback.success
                        ? tokens.accentBorder
                        : tokens.statusSegeraGantiBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.testFeedbackText,
                      {
                        color: testFeedback.success
                          ? tokens.accentText
                          : tokens.statusSegeraGantiText,
                      },
                    ]}>
                    {testFeedback.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Reset Data */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>
                PENGATURAN DATA
              </Text>
              <Pressable
                onPress={handleResetClean}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: tokens.glassFill,
                    borderColor: tokens.glassBorder,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  },
                ]}>
                <RotateCcw size={16} color={tokens.statusSegeraGantiText} />
                <Text
                  style={[
                    styles.secondaryBtnText,
                    { color: tokens.statusSegeraGantiText, fontWeight: '600' },
                  ]}>
                  Reset Data & Mulai Ulang
                </Text>
              </Pressable>
              <Text style={[styles.hintText, { color: tokens.textSubtle, marginTop: 8 }]}>
                Menghapus semua riwayat catatan, log odometer, dan kembali ke panduan awal.
              </Text>
            </View>
          </ScrollView>
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
  },
  sheetContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 10,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  infoRow: {
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  infoMain: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSecondary: {
    fontSize: 13,
    marginTop: 3,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: Radius.chip,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.chip,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  editForm: {
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  editInput: {
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customKmContainer: {
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginTop: 8,
  },
  customKmInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customKmInput: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  customKmUnit: {
    fontSize: 15,
    fontWeight: '600',
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginTop: 10,
  },
  testNotifBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  testFeedbackBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: 8,
  },
  testFeedbackText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
