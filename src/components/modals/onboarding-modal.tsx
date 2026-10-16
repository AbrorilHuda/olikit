import * as Haptics from 'expo-haptics';
import {
  Bell,
  Bike,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  Sliders,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundGlow } from '../ui/background-glow';
import { GlassView } from '../ui/glass-view';
import { MainButton } from '../ui/main-button';
import { Radius, Spacing, useAppTheme } from '@/constants/theme';
import { requestNotificationPermission } from '@/services/notifications';
import { formatNumberIndo } from '@/utils/format';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (data: {
    motorcycleName: string;
    motorcycleYear: number;
    limitKm: number;
    limitMonths: number;
    currentOdometer: number;
    lastOdometer: number;
    lastDate: string;
    isEstimate: boolean;
    notificationsEnabled: boolean;
  }) => void;
}

const COMMON_MOTORCYCLES = [
  'Honda Vario 150',
  'Honda Vario 125',
  'Honda Vario 160',
  'Honda BeAT',
  'Honda Scoopy',
  'Honda PCX 160',
  'Yamaha NMAX',
  'Yamaha Aerox',
];

const COMMON_YEARS = [2015, 2016, 2018, 2020, 2022, 2024];

const KM_INTERVAL_OPTIONS = [
  { km: 2000, label: '2.000 km', sub: 'Pemakaian berat / macet' },
  { km: 3000, label: '3.000 km', sub: 'Kondisi perkotaan' },
  { km: 4000, label: '4.000 km', sub: 'Rekomendasi pabrik', isDefault: true },
  { km: 5000, label: '5.000 km', sub: 'Maksimal oli sintetik' },
];

const MONTH_INTERVAL_OPTIONS = [
  { months: 1, label: '1 Bulan', sub: 'Pemakaian harian intensif' },
  { months: 2, label: '2 Bulan', sub: 'Rekomendasi standar', isDefault: true },
  { months: 3, label: '3 Bulan', sub: 'Pemakaian santai' },
  { months: 6, label: '6 Bulan', sub: 'Jarang digunakan' },
];

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { tokens, isDark } = useAppTheme();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Profil Motor
  const [motorName, setMotorName] = useState<string>('Honda Vario 150');
  const [motorYear, setMotorYear] = useState<string>('2015');

  // Step 2: Target Interval
  const [limitKm, setLimitKm] = useState<number>(4000);
  const [isCustomKm, setIsCustomKm] = useState<boolean>(false);
  const [customKm, setCustomKm] = useState<string>('2500');
  const [limitMonths, setLimitMonths] = useState<number>(2);

  // Step 3: Odometer sekarang & riwayat ganti oli terakhir
  const [currentOdo, setCurrentOdo] = useState<string>('42580');
  const [lastOdo, setLastOdo] = useState<string>('39500');
  const [dateOption, setDateOption] = useState<'today' | '2weeks' | '1month'>(
    '1month'
  );
  const [isEstimate, setIsEstimate] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Step 1 -> Step 2
  const handleNextStep1 = () => {
    if (!motorName.trim()) {
      setErrorMsg('Masukkan nama atau model motor Anda');
      return;
    }
    const yearNum = parseInt(motorYear, 10);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > 2035) {
      setErrorMsg('Masukkan tahun produksi motor yang valid (contoh: 2015)');
      return;
    }
    setErrorMsg(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setStep(2);
  };

  // Handle Step 2 -> Step 3
  const handleNextStep2 = () => {
    if (isCustomKm) {
      const parsed = parseInt(customKm, 10);
      if (isNaN(parsed) || parsed < 500 || parsed > 20000) {
        setErrorMsg('Masukkan batas kilometer antara 500 - 20.000 km');
        return;
      }
      setLimitKm(parsed);
    } else if (limitKm <= 0) {
      setErrorMsg('Pilih batas kilometer yang valid');
      return;
    }

    if (limitMonths <= 0) {
      setErrorMsg('Pilih batas durasi bulan yang valid');
      return;
    }
    setErrorMsg(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setStep(3);
  };

  // Handle Step 3 -> Step 4
  const handleNextStep3 = () => {
    const currNum = parseInt(currentOdo, 10);
    const lastNum = parseInt(lastOdo, 10);

    if (isNaN(currNum) || currNum <= 0) {
      setErrorMsg('Masukkan angka odometer saat ini yang valid');
      return;
    }
    if (isNaN(lastNum) || lastNum < 0) {
      setErrorMsg('Masukkan odometer saat ganti oli terakhir');
      return;
    }
    if (lastNum > currNum) {
      setErrorMsg(
        'Odometer ganti terakhir tidak boleh melebihi odometer saat ini'
      );
      return;
    }

    setErrorMsg(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setStep(4);
  };

  // Handle Step 4: Finish
  const handleFinish = async (enableNotifications: boolean) => {
    let finalNotif = false;
    if (enableNotifications) {
      finalNotif = await requestNotificationPermission();
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const d = new Date();
    if (dateOption === '2weeks') {
      d.setDate(d.getDate() - 14);
    } else if (dateOption === '1month') {
      d.setMonth(d.getMonth() - 1);
    }
    const lastDateStr = d.toISOString().split('T')[0];

    onComplete({
      motorcycleName: motorName.trim() || 'Honda Vario 150',
      motorcycleYear: parseInt(motorYear, 10) || 2015,
      limitKm,
      limitMonths,
      currentOdometer: parseInt(currentOdo, 10) || 42580,
      lastOdometer: parseInt(lastOdo, 10) || 39500,
      lastDate: lastDateStr,
      isEstimate,
      notificationsEnabled: finalNotif || enableNotifications,
    });
  };

  const handlePrevStep = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setErrorMsg(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <BackgroundGlow />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}>
            {/* Step Progress Indicators & Back button */}
            <View style={styles.headerRow}>
              {step > 1 ? (
                <Pressable
                  onPress={handlePrevStep}
                  hitSlop={12}
                  style={styles.backBtn}>
                  <ChevronLeft size={22} color={tokens.textMuted} />
                  <Text style={[styles.backText, { color: tokens.textMuted }]}>
                    Kembali
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.backPlaceholder} />
              )}

              <View style={styles.progressRow}>
                {[1, 2, 3, 4].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          step >= s ? tokens.accent : tokens.ringTrack,
                        width: step === s ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.backPlaceholder} />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* ======================================================== */}
              {/* STEP 1: Profil Motor                                     */}
              {/* ======================================================== */}
              {step === 1 && (
                <View style={styles.stepBox}>
                  <View style={styles.iconCircle}>
                    <Bike size={28} color={tokens.accent} />
                  </View>
                  <Text style={[styles.title, { color: tokens.text }]}>
                    Profil Motor Anda
                  </Text>
                  <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                    Tentukan model motor dan tahun pembuatan agar catatan
                    servis dan pengingat terpersonalisasi.
                  </Text>

                  {/* Input Nama Motor */}
                  <Text
                    style={[styles.fieldSubLabel, { color: tokens.textMuted }]}>
                    NAMA / MODEL MOTOR
                  </Text>
                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.inputCard}
                    contentStyle={styles.inputCardInnerSmall}>
                    <TextInput
                      value={motorName}
                      onChangeText={(val) => {
                        setMotorName(val);
                        setErrorMsg(null);
                      }}
                      style={[styles.textInputMain, { color: tokens.text }]}
                      placeholder="Contoh: Honda Vario 150"
                      placeholderTextColor={tokens.textSubtle}
                      autoCapitalize="words"
                      maxLength={40}
                    />
                  </GlassView>

                  {/* Chips Pilihan Motor Populer */}
                  <View style={styles.chipsScrollWrap}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsWrapHorizontal}>
                      {COMMON_MOTORCYCLES.map((bike) => {
                        const isSel = motorName === bike;
                        return (
                          <Pressable
                            key={bike}
                            onPress={() => {
                              try {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                              } catch {}
                              setMotorName(bike);
                            }}
                            style={[
                              styles.chipSmall,
                              {
                                backgroundColor: isSel
                                  ? tokens.chipSelected
                                  : tokens.glassFill,
                                borderColor: isSel
                                  ? tokens.chipSelected
                                  : tokens.glassBorder,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.chipSmallText,
                                {
                                  color: isSel
                                    ? tokens.chipSelectedText
                                    : tokens.textMuted,
                                  fontWeight: isSel ? '700' : '500',
                                },
                              ]}>
                              {bike}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Input Tahun Motor */}
                  <Text
                    style={[
                      styles.fieldSubLabel,
                      { color: tokens.textMuted, marginTop: 12 },
                    ]}>
                    TAHUN PEMBUATAN
                  </Text>
                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.inputCard}
                    contentStyle={styles.inputCardInnerSmall}>
                    <TextInput
                      value={motorYear}
                      onChangeText={(val) => {
                        setMotorYear(val.replace(/[^0-9]/g, ''));
                        setErrorMsg(null);
                      }}
                      keyboardType="number-pad"
                      style={[styles.textInputMain, { color: tokens.text }]}
                      placeholder="2015"
                      placeholderTextColor={tokens.textSubtle}
                      maxLength={4}
                    />
                  </GlassView>

                  {/* Chips Pilihan Tahun */}
                  <View style={styles.yearChipsRow}>
                    {COMMON_YEARS.map((yr) => {
                      const isSel = motorYear === yr.toString();
                      return (
                        <Pressable
                          key={yr}
                          onPress={() => {
                            try {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                            } catch {}
                            setMotorYear(yr.toString());
                          }}
                          style={[
                            styles.yearChip,
                            {
                              backgroundColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassFill,
                              borderColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassBorder,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.chipSmallText,
                              {
                                color: isSel
                                  ? tokens.chipSelectedText
                                  : tokens.textMuted,
                                fontWeight: isSel ? '700' : '500',
                              },
                            ]}>
                            {yr}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {errorMsg && (
                    <Text
                      style={[
                        styles.errorText,
                        { color: tokens.statusSegeraGantiText },
                      ]}>
                      {errorMsg}
                    </Text>
                  )}

                  <View style={styles.footerBtn}>
                    <MainButton
                      title="Lanjut ke Target Interval"
                      icon={<ChevronRight size={18} color={tokens.onButton} />}
                      onPress={handleNextStep1}
                    />
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* STEP 2: Target Interval Oli                              */}
              {/* ======================================================== */}
              {step === 2 && (
                <View style={styles.stepBox}>
                  <View style={styles.iconCircle}>
                    <Sliders size={28} color={tokens.accent} />
                  </View>
                  <Text style={[styles.title, { color: tokens.text }]}>
                    Batas Interval Oli
                  </Text>
                  <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                    Tentukan kapan oli mesin motor Anda sebaiknya diganti. Nilai
                    ini dapat diubah kapan saja di Pengaturan.
                  </Text>

                  {/* Interval Jarak (km) */}
                  <Text
                    style={[styles.fieldSubLabel, { color: tokens.textMuted }]}>
                    BATAS JARAK KILOMETER
                  </Text>
                  <View style={styles.intervalGrid}>
                    {KM_INTERVAL_OPTIONS.map((opt) => {
                      const isSel = !isCustomKm && limitKm === opt.km;
                      return (
                        <Pressable
                          key={opt.km}
                          onPress={() => {
                            try {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                            } catch {}
                            setIsCustomKm(false);
                            setLimitKm(opt.km);
                          }}
                          style={[
                            styles.intervalCard,
                            {
                              backgroundColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassFill,
                              borderColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassBorder,
                            },
                          ]}>
                          <View style={styles.intervalCardHeader}>
                            <Text
                              style={[
                                styles.intervalKmText,
                                {
                                  color: isSel
                                    ? tokens.chipSelectedText
                                    : tokens.text,
                                },
                              ]}>
                              {opt.label}
                            </Text>
                            {opt.isDefault && (
                              <View
                                style={[
                                  styles.recommendBadge,
                                  {
                                    backgroundColor: isSel
                                      ? 'rgba(255,255,255,0.2)'
                                      : tokens.glassFillSubtle,
                                  },
                                ]}>
                                <Text
                                  style={[
                                    styles.recommendBadgeText,
                                    {
                                      color: isSel
                                        ? tokens.chipSelectedText
                                        : tokens.accent,
                                    },
                                  ]}>
                                  Pabrik
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.intervalSubText,
                              {
                                color: isSel
                                  ? tokens.chipSelectedText
                                  : tokens.textMuted,
                              },
                            ]}>
                            {opt.sub}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {/* Custom Km Card */}
                    <Pressable
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        setIsCustomKm(true);
                      }}
                      style={[
                        styles.intervalCard,
                        {
                          backgroundColor: isCustomKm
                            ? tokens.chipSelected
                            : tokens.glassFill,
                          borderColor: isCustomKm
                            ? tokens.chipSelected
                            : tokens.glassBorder,
                        },
                      ]}>
                      <View style={styles.intervalCardHeader}>
                        <Text
                          style={[
                            styles.intervalKmText,
                            {
                              color: isCustomKm
                                ? tokens.chipSelectedText
                                : tokens.text,
                            },
                          ]}>
                          Kustom
                        </Text>
                        <View
                          style={[
                            styles.recommendBadge,
                            {
                              backgroundColor: isCustomKm
                                ? 'rgba(0,0,0,0.1)'
                                : tokens.glassFillSubtle,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.recommendBadgeText,
                              {
                                color: isCustomKm
                                  ? tokens.chipSelectedText
                                  : tokens.textMuted,
                              },
                            ]}>
                            Bebas
                          </Text>
                        </View>
                      </View>

                      {isCustomKm ? (
                        <View style={styles.onboardingCustomKmBox}>
                          <TextInput
                            value={customKm}
                            onChangeText={(val) => {
                              setCustomKm(val.replace(/[^0-9]/g, ''));
                              setErrorMsg(null);
                            }}
                            keyboardType="number-pad"
                            placeholder="Contoh: 2500"
                            placeholderTextColor={tokens.textSubtle}
                            maxLength={5}
                            style={[
                              styles.onboardingCustomInput,
                              {
                                color: tokens.text,
                                backgroundColor: isDark
                                  ? 'rgba(0,0,0,0.2)'
                                  : 'rgba(255,255,255,0.8)',
                                borderColor: tokens.glassBorder,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.customKmUnit,
                              {
                                color: isCustomKm
                                  ? tokens.chipSelectedText
                                  : tokens.textMuted,
                              },
                            ]}>
                            km
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.intervalSubText,
                            { color: tokens.textMuted },
                          ]}>
                          Tentukan sendiri batas kilometer khusus
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  {/* Interval Waktu (Bulan) */}
                  <Text
                    style={[
                      styles.fieldSubLabel,
                      { color: tokens.textMuted, marginTop: 16 },
                    ]}>
                    BATAS DURASI WAKTU
                  </Text>
                  <View style={styles.monthChipsRow}>
                    {MONTH_INTERVAL_OPTIONS.map((opt) => {
                      const isSel = limitMonths === opt.months;
                      return (
                        <Pressable
                          key={opt.months}
                          onPress={() => {
                            try {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                            } catch {}
                            setLimitMonths(opt.months);
                          }}
                          style={[
                            styles.monthChip,
                            {
                              backgroundColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassFill,
                              borderColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassBorder,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.monthChipTitle,
                              {
                                color: isSel
                                  ? tokens.chipSelectedText
                                  : tokens.text,
                                fontWeight: isSel ? '700' : '600',
                              },
                            ]}>
                            {opt.label}
                          </Text>
                          {opt.isDefault && (
                            <Text
                              style={[
                                styles.monthChipSub,
                                {
                                  color: isSel
                                    ? tokens.chipSelectedText
                                    : tokens.accent,
                                },
                              ]}>
                              Standar
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Tip Card */}
                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.tipCard}
                    contentStyle={styles.tipCardInner}>
                    <Clock size={18} color={tokens.accent} />
                    <Text
                      style={[styles.tipCardText, { color: tokens.textMuted }]}>
                      Ganti oli disarankan setiap{' '}
                      <Text style={{ color: tokens.text, fontWeight: '600' }}>
                        {formatNumberIndo(
                          isCustomKm ? parseInt(customKm, 10) || 2500 : limitKm
                        )}{' '}
                        km
                      </Text>{' '}
                      atau{' '}
                      <Text style={{ color: tokens.text, fontWeight: '600' }}>
                        {limitMonths} bulan
                      </Text>
                      , mana saja yang tercapai lebih dulu.
                    </Text>
                  </GlassView>

                  {errorMsg && (
                    <Text
                      style={[
                        styles.errorText,
                        { color: tokens.statusSegeraGantiText },
                      ]}>
                      {errorMsg}
                    </Text>
                  )}

                  <View style={styles.footerBtn}>
                    <MainButton
                      title="Lanjut ke Odometer"
                      icon={<ChevronRight size={18} color={tokens.onButton} />}
                      onPress={handleNextStep2}
                    />
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* STEP 3: Odometer & Ganti Oli Terakhir                    */}
              {/* ======================================================== */}
              {step === 3 && (
                <View style={styles.stepBox}>
                  <View style={styles.iconCircle}>
                    <Gauge size={28} color={tokens.accent} />
                  </View>
                  <Text style={[styles.title, { color: tokens.text }]}>
                    Status Odometer
                  </Text>
                  <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                    Masukkan angka kilometer speedometer saat ini dan saat
                    terakhir kali oli motor diganti.
                  </Text>

                  {/* Odometer Sekarang */}
                  <Text
                    style={[styles.fieldSubLabel, { color: tokens.textMuted }]}>
                    ODOMETER SEKARANG
                  </Text>
                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.inputCard}
                    contentStyle={styles.inputCardInner}>
                    <TextInput
                      value={currentOdo}
                      onChangeText={(val) => {
                        setCurrentOdo(val.replace(/[^0-9]/g, ''));
                        setErrorMsg(null);
                      }}
                      keyboardType="number-pad"
                      style={[styles.hugeInput, { color: tokens.text }]}
                      placeholder="42580"
                      placeholderTextColor={tokens.textSubtle}
                      maxLength={7}
                    />
                    <Text
                      style={[styles.unitText, { color: tokens.textMuted }]}>
                      km
                    </Text>
                  </GlassView>

                  {/* Odometer Ganti Oli Terakhir */}
                  <Text
                    style={[
                      styles.fieldSubLabel,
                      { color: tokens.textMuted, marginTop: 8 },
                    ]}>
                    ODOMETER SAAT GANTI OLI TERAKHIR
                  </Text>
                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.inputCard}
                    contentStyle={styles.inputCardInner}>
                    <TextInput
                      value={lastOdo}
                      onChangeText={(val) => {
                        setLastOdo(val.replace(/[^0-9]/g, ''));
                        setErrorMsg(null);
                      }}
                      keyboardType="number-pad"
                      style={[styles.hugeInput, { color: tokens.text }]}
                      placeholder="39500"
                      placeholderTextColor={tokens.textSubtle}
                      maxLength={7}
                    />
                    <Text
                      style={[styles.unitText, { color: tokens.textMuted }]}>
                      km
                    </Text>
                  </GlassView>

                  {/* Waktu Ganti Terakhir */}
                  <Text
                    style={[
                      styles.fieldSubLabel,
                      { color: tokens.textMuted, marginTop: 4 },
                    ]}>
                    KIRA-KIRA WAKTU PENGGANTIAN
                  </Text>
                  <View style={styles.dateChipsRow}>
                    {[
                      { id: 'today', label: 'Hari Ini' },
                      { id: '2weeks', label: '2 Minggu Lalu' },
                      { id: '1month', label: '1 Bulan Lalu' },
                    ].map((opt) => {
                      const isSel = dateOption === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => {
                            try {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                            } catch {}
                            setDateOption(opt.id as any);
                          }}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassFill,
                              borderColor: isSel
                                ? tokens.chipSelected
                                : tokens.glassBorder,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.chipBtnText,
                              {
                                color: isSel
                                  ? tokens.chipSelectedText
                                  : tokens.text,
                                fontWeight: isSel ? '700' : '500',
                              },
                            ]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Estimasi Switch */}
                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.switchBox}
                    contentStyle={styles.switchBoxInner}>
                    <View style={styles.switchTexts}>
                      <Text
                        style={[styles.switchTitle, { color: tokens.text }]}>
                        Data perkiraan
                      </Text>
                      <Text
                        style={[
                          styles.switchSub,
                          { color: tokens.textMuted },
                        ]}>
                        Tandai jika odometer atau tanggal di atas hanya tebakan
                      </Text>
                    </View>
                    <Switch
                      value={isEstimate}
                      onValueChange={setIsEstimate}
                      trackColor={{
                        false: isDark ? '#2e3135' : '#d0d4dc',
                        true: tokens.accent,
                      }}
                      thumbColor="#ffffff"
                    />
                  </GlassView>

                  {errorMsg && (
                    <Text
                      style={[
                        styles.errorText,
                        { color: tokens.statusSegeraGantiText },
                      ]}>
                      {errorMsg}
                    </Text>
                  )}

                  <View style={styles.footerBtn}>
                    <MainButton
                      title="Lanjut ke Notifikasi"
                      icon={<ChevronRight size={18} color={tokens.onButton} />}
                      onPress={handleNextStep3}
                    />
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* STEP 4: Izin Notifikasi & Pengingat                      */}
              {/* ======================================================== */}
              {step === 4 && (
                <View style={styles.stepBox}>
                  <View style={styles.iconCircle}>
                    <Bell size={28} color={tokens.accent} />
                  </View>
                  <Text style={[styles.title, { color: tokens.text }]}>
                    Pengingat Tepat Waktu
                  </Text>
                  <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                    Kami akan mengingatkan Anda secara lokal sebelum oli motor{' '}
                    {motorName} mencapai batas {formatNumberIndo(limitKm)} km
                    atau {limitMonths} bulan.
                  </Text>

                  <GlassView
                    borderRadius={Radius.card}
                    style={styles.featureList}
                    contentStyle={styles.featureListInner}>
                    <View style={styles.featureItem}>
                      <Check size={18} color={tokens.accent} />
                      <Text
                        style={[styles.featureText, { color: tokens.text }]}>
                        Pengingat saat sisa &le; 300 km
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Check size={18} color={tokens.accent} />
                      <Text
                        style={[styles.featureText, { color: tokens.text }]}>
                        Pengingat 7 hari sebelum batas {limitMonths} bulan
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Check size={18} color={tokens.accent} />
                      <Text
                        style={[styles.featureText, { color: tokens.text }]}>
                        Pengingat cek odometer berkala
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Check size={18} color={tokens.accent} />
                      <Text
                        style={[styles.featureText, { color: tokens.text }]}>
                        100% offline & tersimpan aman di perangkat (SQLite)
                      </Text>
                    </View>
                  </GlassView>

                  <View style={styles.notifActions}>
                    <MainButton
                      title="Aktifkan & Selesai"
                      onPress={() => handleFinish(true)}
                    />
                    <Pressable
                      onPress={() => handleFinish(false)}
                      style={styles.skipBtn}>
                      <Text
                        style={[
                          styles.skipBtnText,
                          { color: tokens.textMuted },
                        ]}>
                        Nanti saja (Mulai Pakai)
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.horizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.chip,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backPlaceholder: {
    width: 60,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.horizontal,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  stepBox: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  fieldSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  inputCard: {
    width: '100%',
    marginBottom: 12,
  },
  inputCardInner: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  inputCardInnerSmall: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInputMain: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    width: '100%',
  },
  hugeInput: {
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -1.2,
    textAlign: 'center',
    minWidth: 140,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  chipsScrollWrap: {
    width: '100%',
    marginBottom: 16,
  },
  chipsWrapHorizontal: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chipSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  chipSmallText: {
    fontSize: 12,
  },
  yearChipsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  yearChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  intervalCard: {
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  intervalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  intervalKmText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  recommendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  recommendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  intervalSubText: {
    fontSize: 12,
  },
  monthChipsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  monthChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthChipTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  monthChipSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  tipCard: {
    width: '100%',
    marginBottom: 20,
  },
  tipCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  tipCardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBtnText: {
    fontSize: 12,
  },
  switchBox: {
    width: '100%',
    marginBottom: 20,
  },
  switchBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  switchTexts: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureListInner: {
    padding: 18,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  footerBtn: {
    width: '100%',
    marginTop: 8,
  },
  notifActions: {
    width: '100%',
    gap: 12,
  },
  skipBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  onboardingCustomKmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  onboardingCustomInput: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  customKmUnit: {
    fontSize: 15,
    fontWeight: '600',
  },
});
