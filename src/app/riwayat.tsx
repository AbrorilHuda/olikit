import * as Haptics from 'expo-haptics';
import { Droplet, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundGlow } from '@/components/ui/background-glow';
import { GlassView } from '@/components/ui/glass-view';
import { StatTile } from '@/components/ui/stat-tile';
import { Radius, Spacing, useAppTheme } from '@/constants/theme';
import { useOil } from '@/context/oil-context';
import { OilChangeRecord } from '@/types/oil';
import { formatDateIndo, formatKm, formatRupiah } from '@/utils/format';

export default function RiwayatScreen() {
  const { tokens } = useAppTheme();
  const { oilChanges, stats, deleteOilChange } = useOil();

  const [selectedRecord, setSelectedRecord] = useState<OilChangeRecord | null>(
    null
  );

  const handleOpenDetail = (record: OilChangeRecord) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedRecord(record);
  };

  const handleDelete = (id: string) => {
    const doDelete = async () => {
      await deleteOilChange(id);
      setSelectedRecord(null);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Hapus catatan ganti oli ini?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Hapus Catatan',
        'Apakah Anda yakin ingin menghapus catatan ganti oli ini?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: doDelete,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.text }]}>
              Riwayat Oli
            </Text>
            <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
              {oilChanges.length} catatan penggantian oli
            </Text>
          </View>

          {/* Two Summary Stat Tiles */}
          <View style={styles.statsRow}>
            <StatTile
              label="Rata-rata interval"
              value={stats.averageInterval > 0 ? formatKm(stats.averageInterval) : '-'}
              subValue="Jarak antar servis"
            />
            <StatTile
              label="Total biaya"
              value={formatRupiah(stats.totalCost)}
              subValue="Semua penggantian"
            />
          </View>

          {/* List Section Title */}
          <View style={styles.listSectionHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>
              DAFTAR PENGGANTIAN
            </Text>
          </View>

          {/* History Cards List */}
          {oilChanges.length === 0 ? (
            <GlassView
              borderRadius={Radius.card}
              style={styles.emptyCard}
              contentStyle={styles.emptyContent}>
              <Droplet size={36} color={tokens.textSubtle} />
              <Text style={[styles.emptyTitle, { color: tokens.text }]}>
                Belum ada riwayat
              </Text>
              <Text style={[styles.emptySubtitle, { color: tokens.textMuted }]}>
                Catat penggantian oli pertama Anda melalui tab Catat.
              </Text>
            </GlassView>
          ) : (
            <View style={styles.list}>
              {oilChanges.map((item, index) => {
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleOpenDetail(item)}
                    style={({ pressed }) => [
                      styles.itemPressable,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
                    ]}>
                    <GlassView
                      borderRadius={Radius.card}
                      style={styles.historyCard}
                      contentStyle={styles.cardInner}>
                      {/* Left Droplet Icon Column */}
                      <View
                        style={[
                          styles.dropCircle,
                          {
                            backgroundColor:
                              index === 0
                                ? tokens.accentFill
                                : tokens.glassFillSubtle,
                            borderColor:
                              index === 0
                                ? tokens.accentBorder
                                : tokens.glassBorder,
                          },
                        ]}>
                        <Droplet
                          size={18}
                          color={index === 0 ? tokens.accent : tokens.textMuted}
                        />
                      </View>

                      {/* Middle Details */}
                      <View style={styles.detailsCol}>
                        <View style={styles.dateRow}>
                          <Text style={[styles.dateText, { color: tokens.text }]}>
                            {formatDateIndo(item.date)}
                          </Text>
                          {item.isEstimate && (
                            <View
                              style={[
                                styles.pillEstimate,
                                {
                                  backgroundColor: tokens.glassFillSubtle,
                                  borderColor: tokens.glassBorder,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.pillEstimateText,
                                  { color: tokens.textMuted },
                                ]}>
                                Perkiraan
                              </Text>
                            </View>
                          )}
                          {item.includesGearOil && (
                            <View
                              style={[
                                styles.pillGear,
                                {
                                  backgroundColor: tokens.accentFill,
                                  borderColor: tokens.accentBorder,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.pillGearText,
                                  { color: tokens.accentText },
                                ]}>
                                + Gardan
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.subDetail,
                            { color: tokens.textMuted },
                          ]}>
                          {item.oilBrand} • {item.workshop}
                        </Text>
                      </View>

                      {/* Right Side: Odo & Price */}
                      <View style={styles.rightCol}>
                        <Text style={[styles.odoValue, { color: tokens.text }]}>
                          {formatKm(item.odometer)}
                        </Text>
                        <Text
                          style={[styles.priceValue, { color: tokens.textMuted }]}>
                          {formatRupiah(item.price)}
                        </Text>
                        {item.kmDelta !== undefined && item.kmDelta > 0 && (
                          <Text
                            style={[
                              styles.deltaValue,
                              { color: tokens.accentText },
                            ]}>
                            +{formatKm(item.kmDelta)}
                          </Text>
                        )}
                      </View>
                    </GlassView>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Detail / Delete Modal */}
      {selectedRecord && (
        <Modal
          visible={!!selectedRecord}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRecord(null)}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setSelectedRecord(null)}
            />

            <GlassView
              borderRadius={Radius.modal}
              variant="modal"
              intensity={70}
              style={styles.modalSheet}
              contentStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: tokens.text }]}>
                    Detail Penggantian Oli
                  </Text>
                  <Text
                    style={[styles.modalSubtitle, { color: tokens.textMuted }]}>
                    {formatDateIndo(selectedRecord.date)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedRecord(null)}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: tokens.glassFillSubtle },
                  ]}>
                  <X size={18} color={tokens.textMuted} />
                </Pressable>
              </View>

              <View style={styles.modalInfoList}>
                <View
                  style={[
                    styles.modalInfoRow,
                    { borderBottomColor: tokens.separator },
                  ]}>
                  <Text
                    style={[styles.modalInfoLabel, { color: tokens.textMuted }]}>
                    Odometer
                  </Text>
                  <Text
                    style={[styles.modalInfoVal, { color: tokens.text }]}>
                    {formatKm(selectedRecord.odometer)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.modalInfoRow,
                    { borderBottomColor: tokens.separator },
                  ]}>
                  <Text
                    style={[styles.modalInfoLabel, { color: tokens.textMuted }]}>
                    Merek Oli
                  </Text>
                  <Text
                    style={[styles.modalInfoVal, { color: tokens.text }]}>
                    {selectedRecord.oilBrand}
                  </Text>
                </View>

                <View
                  style={[
                    styles.modalInfoRow,
                    { borderBottomColor: tokens.separator },
                  ]}>
                  <Text
                    style={[styles.modalInfoLabel, { color: tokens.textMuted }]}>
                    Biaya
                  </Text>
                  <Text
                    style={[styles.modalInfoVal, { color: tokens.text }]}>
                    {formatRupiah(selectedRecord.price)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.modalInfoRow,
                    { borderBottomColor: tokens.separator },
                  ]}>
                  <Text
                    style={[styles.modalInfoLabel, { color: tokens.textMuted }]}>
                    Bengkel
                  </Text>
                  <Text
                    style={[styles.modalInfoVal, { color: tokens.text }]}>
                    {selectedRecord.workshop}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text
                    style={[styles.modalInfoLabel, { color: tokens.textMuted }]}>
                    Oli Gardan
                  </Text>
                  <Text
                    style={[styles.modalInfoVal, { color: tokens.text }]}>
                    {selectedRecord.includesGearOil
                      ? 'Ya (Diganti)'
                      : 'Tidak'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => handleDelete(selectedRecord.id)}
                  style={[
                    styles.deleteBtn,
                    {
                      backgroundColor: tokens.statusSegeraGantiFill,
                      borderColor: tokens.statusSegeraGantiBorder,
                    },
                  ]}>
                  <Trash2 size={16} color={tokens.statusSegeraGantiText} />
                  <Text
                    style={[
                      styles.deleteBtnText,
                      { color: tokens.statusSegeraGantiText },
                    ]}>
                    Hapus Catatan
                  </Text>
                </Pressable>
              </View>
            </GlassView>
          </View>
        </Modal>
      )}
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.cardGap,
    width: '100%',
  },
  listSectionHeader: {
    marginTop: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  list: {
    gap: 10,
    width: '100%',
  },
  itemPressable: {
    width: '100%',
  },
  historyCard: {
    width: '100%',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  dropCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    gap: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  pillEstimate: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  pillEstimateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  pillGear: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  pillGearText: {
    fontSize: 10,
    fontWeight: '600',
  },
  subDetail: {
    fontSize: 13,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  odoValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  deltaValue: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyCard: {
    width: '100%',
    marginVertical: 20,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfoList: {
    gap: 4,
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalInfoLabel: {
    fontSize: 14,
  },
  modalInfoVal: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalActions: {
    width: '100%',
  },
  deleteBtn: {
    height: 48,
    borderRadius: Radius.chip,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
