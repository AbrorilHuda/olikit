import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, useAppTheme } from '@/constants/theme';
import { StatusType } from '@/types/oil';

interface StatusChipProps {
  status: StatusType;
  label?: string;
  isEstimate?: boolean;
}

export function StatusChip({ status, label, isEstimate }: StatusChipProps) {
  const { tokens } = useAppTheme();

  let accentColor: string = tokens.accent;
  let textColor: string = tokens.accentText;
  let fillColor: string = tokens.accentFill;
  let borderColor: string = tokens.accentBorder;
  let defaultLabel = 'Aman';

  if (status === 'mendekati') {
    accentColor = tokens.statusMendekati;
    textColor = tokens.statusMendekatiText;
    fillColor = tokens.statusMendekatiFill;
    borderColor = tokens.statusMendekatiBorder;
    defaultLabel = 'Mendekati';
  } else if (status === 'segera_ganti') {
    accentColor = tokens.statusSegeraGanti;
    textColor = tokens.statusSegeraGantiText;
    fillColor = tokens.statusSegeraGantiFill;
    borderColor = tokens.statusSegeraGantiBorder;
    defaultLabel = 'Segera Ganti';
  }

  const displayText = label || defaultLabel;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: fillColor,
            borderColor: borderColor,
          },
        ]}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={[styles.text, { color: textColor }]}>{displayText}</Text>
      </View>
      {isEstimate && (
        <View
          style={[
            styles.estimateChip,
            {
              backgroundColor: tokens.glassFill,
              borderColor: tokens.glassBorder,
            },
          ]}>
          <Text style={[styles.estimateText, { color: tokens.textMuted }]}>
            Perkiraan
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.chip,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  estimateChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  estimateText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
