import * as Haptics from 'expo-haptics';
import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassView } from '../ui/glass-view';
import { MainButton } from '../ui/main-button';
import { Radius, useAppTheme } from '@/constants/theme';
import { useOil } from '@/context/oil-context';
import { formatNumberIndo } from '@/utils/format';

interface UpdateOdometerModalProps {
  visible: boolean;
  onClose: () => void;
}

function UpdateOdometerModalContent({ onClose }: { onClose: () => void }) {
  const { tokens } = useAppTheme();
  const { motorcycle, updateOdometer } = useOil();

  const [inputVal, setInputVal] = useState<string>(
    motorcycle.currentOdometer.toString()
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentNum = parseInt(inputVal, 10) || motorcycle.currentOdometer;
  const delta = currentNum - motorcycle.currentOdometer;

  const handleQuickAdd = (km: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    const nextVal = (currentNum + km).toString();
    setInputVal(nextVal);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    const num = parseInt(inputVal, 10);
    if (isNaN(num)) {
      setErrorMsg('Masukkan angka odometer yang valid');
      return;
    }

    const res = await updateOdometer(num);
    if (!res.success) {
      setErrorMsg(res.error || 'Nilai odometer tidak valid');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // web ignore
      }
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // web ignore
    }
    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}>
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
              Perbarui Odometer
            </Text>
            <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
              Odometer sebelumnya: {formatNumberIndo(motorcycle.currentOdometer)} km
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

        {/* Large input */}
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: tokens.inputBg,
              borderColor: errorMsg
                ? tokens.statusSegeraGantiBorder
                : tokens.inputBorder,
            },
          ]}>
          <TextInput
            value={inputVal}
            onChangeText={(txt) => {
              const cleaned = txt.replace(/[^0-9]/g, '');
              setInputVal(cleaned);
              setErrorMsg(null);
            }}
            keyboardType="number-pad"
            style={[styles.numericInput, { color: tokens.text }]}
            autoFocus
            maxLength={7}
          />
          <Text style={[styles.kmLabel, { color: tokens.textMuted }]}>km</Text>
        </View>

        {/* Quick Increment Chips */}
        <View style={styles.quickChipsRow}>
          {[20, 50, 100, 200].map((addKm) => (
            <Pressable
              key={addKm}
              onPress={() => handleQuickAdd(addKm)}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  backgroundColor: tokens.glassFill,
                  borderColor: tokens.glassBorder,
                },
                pressed && { opacity: 0.6 },
              ]}>
              <Text style={[styles.quickChipText, { color: tokens.text }]}>
                +{addKm} km
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Status preview / error */}
        {errorMsg ? (
          <Text
            style={[
              styles.errorText,
              { color: tokens.statusSegeraGantiText },
            ]}>
            {errorMsg}
          </Text>
        ) : (
          <View style={styles.deltaBox}>
            <Text style={[styles.deltaText, { color: tokens.textMuted }]}>
              {delta > 0
                ? `+${formatNumberIndo(delta)} km sejak pencatatan terakhir`
                : delta === 0
                  ? 'Odometer tidak berubah'
                  : 'Nilai odometer lebih rendah dari sebelumnya'}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <MainButton
            title="Simpan Odometer"
            icon={<Check size={18} color={tokens.onButton} />}
            onPress={handleSave}
          />
        </View>
      </GlassView>
    </KeyboardAvoidingView>
  );
}

export function UpdateOdometerModal({
  visible,
  onClose,
}: UpdateOdometerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      {visible ? <UpdateOdometerModalContent onClose={onClose} /> : null}
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
    maxWidth: 440,
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
    fontSize: 20,
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
  inputBox: {
    height: 72,
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  numericInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1,
  },
  kmLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deltaBox: {
    marginBottom: 20,
    alignItems: 'center',
  },
  deltaText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});
