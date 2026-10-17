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
  test('3. Kasus Data Kurang: log kurang dari 2 titik atau rentang hari 0', () => {
    const today = new Date('2026-10-16T00:00:00Z');
    const lastChangeDate = new Date('2026-10-10T00:00:00Z');

    // Hanya 1 log
    const singleLog = [{ date: '2026-10-15T00:00:00Z', odometer: 42000 }];
    const avgSingle = calculateDailyAverage(singleLog, today);
    assert.equal(avgSingle.hasEnoughData, false);
    assert.equal(avgSingle.rataHarian, null);

    // 2 log tapi pada hari yang sama (rentang 0 hari)
    const sameDayLogs = [
      { date: '2026-10-15T00:00:00Z', odometer: 42000 },
      { date: '2026-10-15T08:00:00Z', odometer: 42050 },
    ];
    const avgSame = calculateDailyAverage(sameDayLogs, today);
    assert.equal(avgSame.hasEnoughData, false);
    assert.equal(avgSame.rataHarian, null);

    // Di status oli dengan hanya 1 log: harus menampilkan sisa km saja dan pakai batas waktu untuk tanggal
    const statusRes = calculateOilStatus({
      currentOdometer: 42050,
      lastChangeOdometer: 41000,
      lastChangeDate,
      limitKm: 4000,
      limitMonths: 2,
      odometerLogs: singleLog,
      today,
    });

    assert.equal(statusRes.sisaKm, 2950);
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

  // 6. Kasus Skenario Pengguna: Batas 2500 km, 2 bulan, sisa 2356 km
  test('6. Kasus Skenario Pengguna: interval 2500 km, 2 bulan, estimasi akurat berdasarkan update odometer', () => {
    const today = new Date('2026-10-17T00:00:00Z');
    const lastChangeDate = new Date('2026-10-15T00:00:00Z');

    // Pengguna ganti oli tgl 15 di odo 40.000, lalu update odo tgl 17 di 40.144 (jalan 144 km dlm 2 hari -> 72 km/hari)
    const logs = [
      { date: '2026-10-15T00:00:00Z', odometer: 40000 },
      { date: '2026-10-17T00:00:00Z', odometer: 40144 },
    ];

    const res = calculateOilStatus({
      currentOdometer: 40144,
      lastChangeOdometer: 40000,
      lastChangeDate,
      limitKm: 2500,
      limitMonths: 2,
      odometerLogs: logs,
      today,
    });

    assert.equal(res.kmTerpakai, 144);
    assert.equal(res.sisaKm, 2356);
    assert.equal(res.status, 'aman');
    assert.equal(res.rataHarian, 72);
    assert.equal(res.hasDateEstimate, true);
    // Sisa hari = 2356 / 72 = 33 hari (bukan 2 hari!)
    assert.equal(res.sisaHari, 33);
    // Tanggal ganti adalah sekitar 33 hari ke depan (~19 November 2026), bukan 19 Oktober!
    assert.equal(res.tanggalGanti.getMonth(), 10); // November (0-indexed: 10)
  });
});
