import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { GlassView } from './glass-view';
import { StatusChip } from './status-chip';
import { Radius, useAppTheme } from '@/constants/theme';
import { OilCalculationResult } from '@/lib/oil';
import { formatDateIndo, formatNumberIndo } from '@/utils/format';

interface OilRingCardProps {
  oilStatus: OilCalculationResult;
}

export function OilRingCard({ oilStatus }: OilRingCardProps) {
  const { tokens } = useAppTheme();

  const diameter = 220;
  const strokeWidth = 10;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Determine stroke color based on status
  let strokeColor: string = tokens.accent;
  if (oilStatus.status === 'mendekati') {
    strokeColor = tokens.statusMendekati;
  } else if (oilStatus.status === 'segera_ganti') {
    strokeColor = tokens.statusSegeraGanti;
  }

  // Dashoffset
  const progressRatio = Math.max(0, Math.min(100, oilStatus.persenSisa)) / 100;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <GlassView
      borderRadius={Radius.heroCard}
      style={styles.card}
      contentStyle={styles.cardContent}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.cardTitle, { color: tokens.text }]}>
            Oli Mesin
          </Text>
          <Text style={[styles.cardSubtitle, { color: tokens.textMuted }]}>
            Kapasitas 0.8L • SAE 10W-30
          </Text>
        </View>
        <StatusChip
          status={oilStatus.status}
          label={oilStatus.statusLabel}
          isEstimate={oilStatus.isEstimate}
        />
      </View>

      {/* Circular Progress Ring */}
      <View style={styles.ringWrapper}>
        <Svg
          width={diameter}
          height={diameter}
          style={styles.svgCircle}
          viewBox={`0 0 ${diameter} ${diameter}`}>
          {/* Background Track Circle */}
          <Circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={tokens.ringTrack}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <Circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
          />
        </Svg>

        {/* Center Text Information */}
        <View style={styles.centerInfo}>
          {oilStatus.isOverdue ? (
            <>
              <Text
                style={[
                  styles.heroNumber,
                  { color: tokens.statusSegeraGanti },
                ]}>
                +{formatNumberIndo(oilStatus.overdueKm)}
              </Text>
              <Text
                style={[
                  styles.heroUnit,
                  { color: tokens.statusSegeraGantiText },
                ]}>
                lewat {formatNumberIndo(oilStatus.overdueKm)} km
              </Text>
              <View
                style={[
                  styles.daysBadge,
                  { backgroundColor: tokens.statusSegeraGantiFill },
                ]}>
                <Text
                  style={[
                    styles.daysText,
                    { color: tokens.statusSegeraGantiText },
                  ]}>
                  Segera ganti sekarang
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.heroNumber, { color: tokens.text }]}>
                {formatNumberIndo(oilStatus.sisaKm)}
              </Text>
              <Text style={[styles.heroUnit, { color: tokens.textMuted }]}>
                km tersisa
              </Text>
              <View
                style={[
                  styles.daysBadge,
                  oilStatus.status === 'mendekati' && {
                    backgroundColor: tokens.statusMendekatiFill,
                    borderWidth: 1,
                    borderColor: tokens.statusMendekatiBorder,
                  },
                ]}>
                <Text
                  style={[
                    styles.daysText,
                    {
                      color:
                        oilStatus.status === 'mendekati'
                          ? tokens.statusMendekatiText
                          : tokens.textMuted,
                    },
                  ]}>
                  {oilStatus.hasDateEstimate
                    ? `sekitar ${oilStatus.sisaHari} hari lagi`
                    : 'Berdasarkan sisa km'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Footer text */}
      <View style={[styles.footer, { borderTopColor: tokens.separator }]}>
        <Text style={[styles.footerText, { color: tokens.textMuted }]}>
          {oilStatus.isOverdue
            ? `Batas terlewati (${oilStatus.sisaKmDisplay})`
            : `Ganti sebelum ${formatDateIndo(oilStatus.tanggalGanti)} ${
                oilStatus.hasDateEstimate ? '(perkiraan)' : '(batas waktu)'
              }`}
        </Text>
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleColumn: {
    gap: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  ringWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  svgCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNumber: {
    fontSize: 52,
    fontWeight: '300',
    letterSpacing: -2,
    lineHeight: 56,
  },
  heroUnit: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  daysBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    width: '100%',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
