import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  calculateDailyAverage,
  calculateOilStatus,
  validateNewOdometer,
} from '../src/lib/oil.ts';

describe('Unit Tests: Logika Perhitungan Oli Vario 150 (src/lib/oil.ts)', () => {
  // 1. Kasus Normal
  test('1. Kasus Normal: km aman, waktu aman, perkiraan tanggal aktif', () => {
    const today = new Date('2026-10-16T00:00:00Z');
    const lastChangeDate = new Date('2026-09-15T00:00:00Z'); // 31 hari lalu

    const logs = [
      { date: '2026-09-15T00:00:00Z', odometer: 40000 },
      { date: '2026-09-25T00:00:00Z', odometer: 40280 },
      { date: '2026-10-05T00:00:00Z', odometer: 40560 },
      { date: '2026-10-16T00:00:00Z', odometer: 40580 },
    ];

    const res = calculateOilStatus({
      currentOdometer: 40580,
      lastChangeOdometer: 40000,
      lastChangeDate,
      limitKm: 4000,
      limitMonths: 2,
      odometerLogs: logs,
      today,
    });

    assert.equal(res.kmTerpakai, 580);
    assert.equal(res.sisaKm, 3420);
    assert.equal(res.isOverdue, false);
    assert.equal(res.overdueKm, 0);
    assert.equal(res.status, 'aman');
    assert.equal(res.statusLabel, 'Aman');
    assert.match(res.sisaKmDisplay, /3\.420 km tersisa/);
    assert.equal(res.hasDailyAverage, true);
    assert.ok(res.rataHarian && res.rataHarian > 0);
    assert.equal(res.hasDateEstimate, true);
  });

  // 2. Kasus Lewat Batas (Overdue)
  test('2. Kasus Lewat Batas: km melewati batas (misal lewat 110 km)', () => {
    const today = new Date('2026-10-16T00:00:00Z');
    const lastChangeDate = new Date('2026-08-01T00:00:00Z');

    const res = calculateOilStatus({
      currentOdometer: 44110,
      lastChangeOdometer: 40000,
      lastChangeDate,
      limitKm: 4000, // batas 4000, terpakai 4110 -> lewat 110 km
      limitMonths: 2,
      today,
    });

    assert.equal(res.kmTerpakai, 4110);
    assert.equal(res.sisaKm, -110);
    assert.equal(res.isOverdue, true);
    assert.equal(res.overdueKm, 110);
    assert.equal(res.status, 'segera_ganti');
    assert.equal(res.statusLabel, 'Segera ganti');
    assert.equal(res.sisaKmDisplay, 'lewat 110 km');
  });

  // 3. Kasus Data Kurang
  test('3. Kasus Data Kurang: log kurang dari 2 titik atau rentang < 7 hari', () => {
    const today = new Date('2026-10-16T00:00:00Z');
    const lastChangeDate = new Date('2026-10-10T00:00:00Z');

    // Hanya 1 log
    const singleLog = [{ date: '2026-10-15T00:00:00Z', odometer: 42000 }];
    const avgSingle = calculateDailyAverage(singleLog, today);
    assert.equal(avgSingle.hasEnoughData, false);
    assert.equal(avgSingle.rataHarian, null);

    // 2 log tapi rentang hanya 3 hari (< 7 hari)
    const shortSpanLogs = [
      { date: '2026-10-10T00:00:00Z', odometer: 42000 },
      { date: '2026-10-13T00:00:00Z', odometer: 42100 },
    ];
    const avgShort = calculateDailyAverage(shortSpanLogs, today);
    assert.equal(avgShort.hasEnoughData, false);
    assert.equal(avgShort.rataHarian, null);

    // Di status oli: harus menampilkan sisa km saja dan pakai batas waktu untuk tanggal
    const statusRes = calculateOilStatus({
      currentOdometer: 42100,
      lastChangeOdometer: 41000,
      lastChangeDate,
      limitKm: 4000,
      limitMonths: 2,
      odometerLogs: shortSpanLogs,
      today,
    });

    assert.equal(statusRes.sisaKm, 2900);
    assert.equal(statusRes.hasDailyAverage, false);
    assert.equal(statusRes.rataHarian, null);
    assert.equal(statusRes.hasDateEstimate, false);
    // Tanggal ganti harus sama persis dengan batas waktu (2 bulan dari lastChangeDate)
    assert.equal(
      statusRes.tanggalGanti.getTime(),
      statusRes.tanggalWaktu.getTime()
    );
  });

  // 4. Kasus Odometer Turun
  test('4. Kasus Odometer Turun: tolak input lebih kecil dari sebelumnya', () => {
    const currentOdo = 42580;

    // Nilai lebih kecil -> ditolak
    const invalidRes = validateNewOdometer(currentOdo, 42000);
    assert.equal(invalidRes.valid, false);
    assert.ok(invalidRes.error && invalidRes.error.length > 0);

    // Nilai sama -> diterima
    const sameRes = validateNewOdometer(currentOdo, 42580);
    assert.equal(sameRes.valid, true);

    // Nilai lebih besar -> diterima
    const validRes = validateNewOdometer(currentOdo, 42650);
    assert.equal(validRes.valid, true);
  });

  // 5. Kasus Ganti Lebih Awal
  test('5. Kasus Ganti Lebih Awal: siklus baru dihitung penuh dari titik ganti tersebut', () => {
    const today = new Date('2026-10-16T00:00:00Z');

    // Servis sebelumnya di 38.000. Pengguna ganti lebih awal di 40.500 (baru 2.500 km dari batas 4.000).
    const newServiceOdometer = 40500;
    const currentOdometer = 40650; // 150 km setelah ganti oli

    const res = calculateOilStatus({
      currentOdometer,
      lastChangeOdometer: newServiceOdometer,
      lastChangeDate: '2026-10-10T00:00:00Z',
      limitKm: 4000,
      limitMonths: 2,
      today,
    });

    assert.equal(res.kmTerpakai, 150);
    assert.equal(res.sisaKm, 3850);
    assert.equal(res.status, 'aman');
    assert.equal(res.isOverdue, false);
    assert.equal(res.persenSisa > 90, true);
  });
});
