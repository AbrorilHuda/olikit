import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Gauge, Plus, Settings as SettingsIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingModal } from '@/components/modals/onboarding-modal';
import { SettingsModal } from '@/components/modals/settings-modal';
import { UpdateOdometerModal } from '@/components/modals/update-odometer-modal';
import { BackgroundGlow } from '@/components/ui/background-glow';
import { MainButton } from '@/components/ui/main-button';
import { OilRingCard } from '@/components/ui/oil-ring';
import { StatTile } from '@/components/ui/stat-tile';
import { Radius, Spacing, useAppTheme } from '@/constants/theme';
import { useOil } from '@/context/oil-context';
import { formatKm } from '@/utils/format';

export default function HomeScreen() {
  const { tokens } = useAppTheme();
  const { motorcycle, oilStatus, settings, completeOnboarding } = useOil();
  const router = useRouter();

  const [showSettings, setShowSettings] = useState(false);
  const [showUpdateOdo, setShowUpdateOdo] = useState(false);

  const handleOpenSettings = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // web ignore
    }
    setShowSettings(true);
  };

  const handleOpenCheckOdo = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // web ignore
    }
    setShowUpdateOdo(true);
  };

  const handleNavigateCatat = () => {
    router.push('/catat');
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Header Row */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: tokens.textMuted }]}>
                Motor saya
              </Text>
              <View style={styles.motorRow}>
                <Text style={[styles.motorName, { color: tokens.text }]}>
                  {motorcycle.name.replace('Honda ', '')}
                </Text>
                <View
                  style={[
                    styles.yearBadge,
                    {
                      backgroundColor: tokens.glassFill,
                      borderColor: tokens.glassBorder,
                    },
                  ]}>
                  <Text style={[styles.yearText, { color: tokens.textMuted }]}>
                    {motorcycle.year}
                  </Text>
                </View>
              </View>
            </View>

            {/* Settings button */}
            <Pressable
              onPress={handleOpenSettings}
              accessibilityLabel="Pengaturan"
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: tokens.glassFill,
                  borderColor: tokens.glassBorder,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <SettingsIcon size={20} color={tokens.text} strokeWidth={1.8} />
            </Pressable>
          </View>

          {/* Hero Ring Card */}
          <OilRingCard oilStatus={oilStatus} />

          {/* Stat Tiles (Side-by-side) */}
          <View style={styles.statsRow}>
            <StatTile
              label="Odometer"
              value={formatKm(motorcycle.currentOdometer)}
              subValue="Cek & perbarui >"
              icon={<Gauge size={16} color={tokens.textMuted} />}
              onPress={handleOpenCheckOdo}
            />

            <StatTile
              label="Rata-rata harian"
              value={
                oilStatus.hasDailyAverage && oilStatus.rataHarian
                  ? `${oilStatus.rataHarian} km/hari`
                  : '-'
              }
              subValue={
                oilStatus.hasDailyAverage
                  ? 'Berdasarkan odometer'
                  : 'Perbarui odometer untuk perkiraan'
              }
            />
          </View>

          {/* Action Buttons: Cek Odometer & Catat Ganti Oli */}
          <View style={styles.actionSection}>
            <MainButton
              title="Cek Odometer"
              icon={<Gauge size={20} color={tokens.onButton} strokeWidth={2.2} />}
              onPress={handleOpenCheckOdo}
              style={styles.primaryBtn}
            />

            <MainButton
              title="Catat Ganti Oli"
              variant="secondary"
              icon={<Plus size={18} color={tokens.text} strokeWidth={2.2} />}
              onPress={handleNavigateCatat}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Cek Odometer Modal */}
      <UpdateOdometerModal
        visible={showUpdateOdo}
        onClose={() => setShowUpdateOdo(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Onboarding Modal (if first time) */}
      <OnboardingModal
        visible={!settings.onboarded}
        onComplete={completeOnboarding}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  motorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  motorName: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.8,
  },
  yearBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.cardGap,
    width: '100%',
  },
  actionSection: {
    marginTop: 4,
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    marginBottom: 2,
  },
});
