import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Check,
  DollarSign,
  Edit3,
  MapPin,
  Wrench,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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

import { DatePickerModal } from '@/components/modals/date-picker-modal';
import { BackgroundGlow } from '@/components/ui/background-glow';
import { GlassView } from '@/components/ui/glass-view';
import { MainButton } from '@/components/ui/main-button';
import { Radius, Spacing, useAppTheme } from '@/constants/theme';
import { useOil } from '@/context/oil-context';
import { formatDateIndo } from '@/utils/format';

const POPULAR_OILS = [
  'AHM MPX2',
  'AHM SPX2',
  'Castrol Power1',
  'Shell Advance',
  'Motul Scooter',
];

export default function CatatScreen() {
  const { tokens, isDark } = useAppTheme();
  const { motorcycle, addOilChange } = useOil();
  const router = useRouter();

  // State
  const [odometer, setOdometer] = useState<string>(
    motorcycle.currentOdometer.toString()
  );
  const [serviceDate, setServiceDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [oilBrand, setOilBrand] = useState<string>('AHM MPX2');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [price, setPrice] = useState<string>('65000');
  const [workshop, setWorkshop] = useState<string>('AHASS Cipete');
  const [includesGearOil, setIncludesGearOil] = useState<boolean>(false);
  const [isEstimate, setIsEstimate] = useState<boolean>(false);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickAdd = (km: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    const current = parseInt(odometer, 10) || motorcycle.currentOdometer;
    setOdometer((current + km).toString());
    setErrorMsg(null);
  };

  const handleSelectOil = (brand: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    setOilBrand(brand);
  };

  const handleSave = async () => {
    const odoNum = parseInt(odometer, 10);
    if (isNaN(odoNum) || odoNum <= 0) {
      setErrorMsg('Odometer wajib diisi dengan benar');
      return;
    }

    const priceNum = parseInt(price.replace(/[^\d]/g, ''), 10) || 0;
    const finalBrand =
      oilBrand === 'Lainnya' ? customBrand || 'Oli Mesin' : oilBrand;

    await addOilChange({
      date: serviceDate.toISOString().split('T')[0],
      odometer: odoNum,
      oilBrand: finalBrand,
      price: priceNum,
      workshop: workshop.trim() || 'Bengkel',
      includesGearOil,
      isEstimate,
    });

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // web ignore
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      router.push('/');
    }, 900);
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Title Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: tokens.text }]}>
                Catat Ganti Oli
              </Text>
              <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                Odometer sebelumnya: {motorcycle.currentOdometer.toLocaleString('id-ID')} km
              </Text>
            </View>

            {/* Giant Odometer Input Card */}
            <GlassView
              borderRadius={Radius.card}
              style={styles.odoCard}
              contentStyle={styles.odoCardContent}>
              <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
                ODOMETER PENGGANTIAN
              </Text>

              <View style={styles.odoInputRow}>
                <TextInput
                  value={odometer}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/[^0-9]/g, '');
                    setOdometer(cleaned);
                    setErrorMsg(null);
                  }}
                  keyboardType="number-pad"
                  style={[styles.bigOdoText, { color: tokens.text }]}
                  placeholderTextColor={tokens.textSubtle}
                  placeholder="0"
                  maxLength={7}
                />
                <Text style={[styles.bigOdoUnit, { color: tokens.textMuted }]}>
                  km
                </Text>
              </View>

              {/* Quick Stepper Chips */}
              <View style={styles.quickSteps}>
                {[50, 100, 250, 500].map((step) => (
                  <Pressable
                    key={step}
                    onPress={() => handleQuickAdd(step)}
                    style={({ pressed }) => [
                      styles.stepChip,
                      {
                        backgroundColor: tokens.glassFill,
                        borderColor: tokens.glassBorder,
                      },
                      pressed && { opacity: 0.6 },
                    ]}>
                    <Text style={[styles.stepChipText, { color: tokens.text }]}>
                      +{step}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </GlassView>

            {/* Form Details Card */}
            <GlassView
              borderRadius={Radius.card}
              style={styles.formCard}
              contentStyle={styles.formCardContent}>
              {/* Tanggal Section with Date Picker and Quick Presets */}
              <View style={[styles.dateSection, { borderBottomColor: tokens.separator }]}>
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setShowDatePicker(true);
                  }}
                  style={styles.formRowClickable}>
                  <View style={styles.rowLabelGroup}>
                    <Calendar size={18} color={tokens.accent} />
                    <Text style={[styles.rowLabel, { color: tokens.text }]}>
                      Tanggal Servis
                    </Text>
                  </View>
                  <View style={styles.dateValueRight}>
                    <Text style={[styles.rowValueText, { color: tokens.text }]}>
                      {formatDateIndo(serviceDate)}
                    </Text>
                    <View
                      style={[
                        styles.editDateBadge,
                        {
                          backgroundColor: tokens.glassFillSubtle,
                          borderColor: tokens.glassBorder,
                        },
                      ]}>
                      <Edit3 size={11} color={tokens.accent} />
                      <Text style={[styles.editDateText, { color: tokens.accent }]}>
                        Ubah
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Quick Date Chips */}
                <View style={styles.dateQuickRow}>
                  {[
                    { label: 'Hari Ini', offset: 0 },
                    { label: 'Kemarin', offset: 1 },
                    { label: '3 Hari Lalu', offset: 3 },
                    { label: '1 Minggu Lalu', offset: 7 },
                  ].map((item) => {
                    const d = new Date();
                    d.setDate(d.getDate() - item.offset);
                    const isSelected =
                      serviceDate.toDateString() === d.toDateString();
                    return (
                      <Pressable
                        key={item.offset}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          } catch {}
                          setServiceDate(d);
                        }}
                        style={[
                          styles.dateQuickChip,
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
                            styles.dateQuickChipText,
                            {
                              color: isSelected
                                ? tokens.chipSelectedText
                                : tokens.textMuted,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Merek Oli Row */}
              <View style={[styles.brandSection, { borderBottomColor: tokens.separator }]}>
                <View style={styles.rowLabelGroup}>
                  <Wrench size={18} color={tokens.textMuted} />
                  <Text style={[styles.rowLabel, { color: tokens.text }]}>
                    Merek Oli
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.brandChipsRow}>
                  {POPULAR_OILS.map((brand) => {
                    const isSelected = oilBrand === brand;
                    return (
                      <Pressable
                        key={brand}
                        onPress={() => handleSelectOil(brand)}
                        style={[
                          styles.brandChip,
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
                            styles.brandChipText,
                            {
                              color: isSelected
                                ? tokens.chipSelectedText
                                : tokens.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {brand}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => handleSelectOil('Lainnya')}
                    style={[
                      styles.brandChip,
                      {
                        backgroundColor:
                          oilBrand === 'Lainnya'
                            ? tokens.chipSelected
                            : tokens.glassFill,
                        borderColor:
                          oilBrand === 'Lainnya'
                            ? tokens.chipSelected
                            : tokens.glassBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.brandChipText,
                        {
                          color:
                            oilBrand === 'Lainnya'
                              ? tokens.chipSelectedText
                              : tokens.text,
                          fontWeight: oilBrand === 'Lainnya' ? '700' : '500',
                        },
                      ]}>
                      Lainnya
                    </Text>
                  </Pressable>
                </ScrollView>

                {oilBrand === 'Lainnya' && (
                  <TextInput
                    value={customBrand}
                    onChangeText={setCustomBrand}
                    placeholder="Tulis merek oli..."
                    placeholderTextColor={tokens.textSubtle}
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: tokens.inputBg,
                        borderColor: tokens.inputBorder,
                        color: tokens.text,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Harga Row */}
              <View style={[styles.formRow, { borderBottomColor: tokens.separator }]}>
                <View style={styles.rowLabelGroup}>
                  <DollarSign size={18} color={tokens.textMuted} />
                  <Text style={[styles.rowLabel, { color: tokens.text }]}>
                    Biaya / Harga
                  </Text>
                </View>
                <View style={styles.priceInputWrapper}>
                  <Text style={[styles.rpPrefix, { color: tokens.textMuted }]}>
                    Rp
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={(val) => {
                      const numOnly = val.replace(/[^0-9]/g, '');
                      setPrice(numOnly);
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={tokens.textSubtle}
                    style={[styles.priceInput, { color: tokens.text }]}
                  />
                </View>
              </View>

              {/* Bengkel Row */}
              <View style={[styles.formRow, { borderBottomColor: tokens.separator }]}>
                <View style={styles.rowLabelGroup}>
                  <MapPin size={18} color={tokens.textMuted} />
                  <Text style={[styles.rowLabel, { color: tokens.text }]}>
                    Bengkel
                  </Text>
                </View>
                <TextInput
                  value={workshop}
                  onChangeText={setWorkshop}
                  placeholder="Nama bengkel..."
                  placeholderTextColor={tokens.textSubtle}
                  style={[styles.textInputRight, { color: tokens.text }]}
                />
              </View>

              {/* Oli Gardan Switch Row */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={[styles.switchTitle, { color: tokens.text }]}>
                    Sekalian ganti oli gardan
                  </Text>
                  <Text style={[styles.switchSubtitle, { color: tokens.textMuted }]}>
                    Biasanya diganti setiap 8.000 km
                  </Text>
                </View>
                <Switch
                  value={includesGearOil}
                  onValueChange={(val) => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setIncludesGearOil(val);
                  }}
                  trackColor={{
                    false: isDark ? '#2e3135' : '#d0d4dc',
                    true: tokens.accent,
                  }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Perkiraan Switch Row */}
              <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: tokens.separator }]}>
                <View style={styles.switchLabelCol}>
                  <Text style={[styles.switchTitle, { color: tokens.text }]}>
                    Tandai sebagai perkiraan
                  </Text>
                  <Text style={[styles.switchSubtitle, { color: tokens.textMuted }]}>
                    Aktifkan bila tanggal atau km hanya kira-kira
                  </Text>
                </View>
                <Switch
                  value={isEstimate}
                  onValueChange={(val) => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setIsEstimate(val);
                  }}
                  trackColor={{
                    false: isDark ? '#2e3135' : '#d0d4dc',
                    true: tokens.accent,
                  }}
                  thumbColor="#ffffff"
                />
              </View>
            </GlassView>

            {/* Error Message */}
            {errorMsg && (
              <Text
                style={[
                  styles.errorText,
                  { color: tokens.statusSegeraGantiText },
                ]}>
                {errorMsg}
              </Text>
            )}

            {/* Save Button */}
            <View style={styles.actionSection}>
              <MainButton
                title={savedSuccess ? 'Tersimpan!' : 'Simpan Catatan'}
                icon={
                  savedSuccess ? (
                    <Check size={20} color={tokens.onButton} strokeWidth={2.4} />
                  ) : undefined
                }
                onPress={handleSave}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={serviceDate}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(newDate) => setServiceDate(newDate)}
        maxDate={new Date()}
      />
    </View>
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
  scrollContent: {
    paddingHorizontal: Spacing.horizontal,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: Spacing.tabBarHeight + Spacing.tabBarBottom + 32,
    gap: Spacing.cardGap,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 4,
    paddingVertical: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  odoCard: {
    width: '100%',
  },
  odoCardContent: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  odoInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigOdoText: {
    fontSize: 52,
    fontWeight: '300',
    letterSpacing: -1.5,
    minWidth: 160,
    paddingVertical: 0,
  },
  bigOdoUnit: {
    fontSize: 22,
    fontWeight: '500',
    marginLeft: 8,
  },
  quickSteps: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  stepChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
  },
  formCardContent: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  dateSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  formRowClickable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  dateValueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  editDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateQuickRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  dateQuickChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateQuickChipText: {
    fontSize: 11,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowValueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.chip,
  },
  rowValueText: {
    fontSize: 15,
    fontWeight: '600',
  },
  brandSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  brandChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.chip,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  brandChipText: {
    fontSize: 13,
  },
  customInput: {
    height: 44,
    borderRadius: Radius.chip,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginTop: 4,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rpPrefix: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceInput: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 90,
  },
  textInputRight: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 130,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 58,
    paddingVertical: 10,
  },
  switchLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 6,
    width: '100%',
  },
});
