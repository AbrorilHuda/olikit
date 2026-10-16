import * as Haptics from 'expo-haptics';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GlassView } from '../ui/glass-view';
import { Radius, useAppTheme } from '@/constants/theme';
import { formatDateIndo } from '@/utils/format';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  maxDate?: Date;
}

const MONTH_NAMES = [
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

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function DatePickerModal(props: DatePickerModalProps) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}>
      {props.visible ? <DatePickerContent {...props} /> : null}
    </Modal>
  );
}

function DatePickerContent({
  selectedDate,
  onClose,
  onSelectDate,
  maxDate = new Date(),
}: DatePickerModalProps) {
  const { tokens } = useAppTheme();

  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth()); // 0-11

  const handlePrevMonth = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    // Don't go beyond maxDate's month and year
    if (
      viewYear > maxDate.getFullYear() ||
      (viewYear === maxDate.getFullYear() && viewMonth >= maxDate.getMonth())
    ) {
      return;
    }

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const chosen = new Date(viewYear, viewMonth, day);
    // Don't allow picking future date beyond maxDate
    if (chosen.getTime() > maxDate.getTime() + 86400000 - 1) {
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectDate(chosen);
    onClose();
  };

  const handleQuickPreset = (daysAgo: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    onSelectDate(d);
    onClose();
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-first index: (0=Sun -> 6, 1=Mon -> 0, etc.)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const canGoNext =
    viewYear < maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth());

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isFuture = (day: number) => {
    const current = new Date(viewYear, viewMonth, day);
    // end of maxDate day
    const limit = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      maxDate.getDate(),
      23,
      59,
      59
    );
    return current.getTime() > limit.getTime();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <GlassView
        borderRadius={Radius.modal}
        variant="modal"
        intensity={70}
        style={styles.dialogContainer}
        contentStyle={styles.dialogContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: tokens.text }]}>
              Pilih Tanggal Servis
            </Text>
            <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
              {formatDateIndo(selectedDate)}
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

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          {[
            { label: 'Hari Ini', days: 0 },
            { label: 'Kemarin', days: 1 },
            { label: '3 Hari Lalu', days: 3 },
            { label: '1 Minggu Lalu', days: 7 },
          ].map((p) => (
            <Pressable
              key={p.days}
              onPress={() => handleQuickPreset(p.days)}
              style={[
                styles.presetChip,
                {
                  backgroundColor: tokens.glassFill,
                  borderColor: tokens.glassBorder,
                },
              ]}>
              <Text
                style={[styles.presetChipText, { color: tokens.textMuted }]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Month/Year Navigation */}
        <View style={styles.navRow}>
          <Pressable
            onPress={handlePrevMonth}
            hitSlop={12}
            style={[
              styles.navBtn,
              {
                backgroundColor: tokens.glassFill,
                borderColor: tokens.glassBorder,
              },
            ]}>
            <ChevronLeft size={18} color={tokens.text} />
          </Pressable>

          <View style={styles.monthTitleBox}>
            <CalendarIcon size={16} color={tokens.accent} />
            <Text style={[styles.monthTitleText, { color: tokens.text }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
          </View>

          <Pressable
            onPress={handleNextMonth}
            disabled={!canGoNext}
            hitSlop={12}
            style={[
              styles.navBtn,
              {
                backgroundColor: tokens.glassFill,
                borderColor: tokens.glassBorder,
                opacity: canGoNext ? 1 : 0.25,
              },
            ]}>
            <ChevronRight size={18} color={tokens.text} />
          </Pressable>
        </View>

        {/* Day Headers (Sen, Sel, Rab...) */}
        <View style={styles.daysHeaderRow}>
          {DAY_LABELS.map((lbl) => (
            <Text
              key={lbl}
              style={[styles.dayHeaderCell, { color: tokens.textSubtle }]}>
              {lbl}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.calendarGrid}>
          {/* Empty slots for offset */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <View key={`empty-${idx}`} style={styles.dayCellPlaceholder} />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const sel = isSelected(day);
            const tday = isToday(day);
            const disabled = isFuture(day);

            return (
              <Pressable
                key={`day-${day}`}
                onPress={() => handleSelectDay(day)}
                disabled={disabled}
                style={[
                  styles.dayCell,
                  sel && {
                    backgroundColor: tokens.chipSelected,
                  },
                  !sel &&
                    tday && {
                      borderColor: tokens.accent,
                      borderWidth: 1,
                    },
                ]}>
                <Text
                  style={[
                    styles.dayCellText,
                    {
                      color: sel
                        ? tokens.chipSelectedText
                        : disabled
                          ? tokens.textSubtle
                          : tokens.text,
                      fontWeight: sel ? '700' : tday ? '600' : '400',
                    },
                  ]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
  },
  dialogContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: Radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.chip,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  dayHeaderCell: {
    width: 40,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCellPlaceholder: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.chip,
    marginVertical: 1,
  },
  dayCellText: {
    fontSize: 13,
  },
});
