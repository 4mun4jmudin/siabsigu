import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import DangerButton from '@/Components/DangerButton';
import { RefreshCw, Database, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Full BackupSettingsForm with listing backups and restore support.
// NOTE: Adjust route name constants below to match your routes if they differ.
const BACKUP_SETTINGS_ROUTE = 'admin.pengaturan.update-backup'; // put/patch route to save backup settings
const LIST_BACKUPS_ROUTE = 'admin.maintenance.backups';
const MANUAL_BACKUP_ROUTE = 'admin.maintenance.backup-manual';
const RESTORE_ROUTE = 'admin.maintenance.restore';

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

async function postJson(url, body = {}) {
  const res = await fetch(route(url), {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-TOKEN': getCsrfToken(),
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, payload };
}

async function getJson(url) {
  const res = await fetch(route(url), {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const payload = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, payload };
}

export default function BackupSettingsForm({ className = '', pengaturan = {} }) {
  const { data, setData, put, post, processing, errors, recentlySuccessful } = useForm({
    backup_auto_enabled: !!pengaturan.backup_auto_enabled,
    backup_time: pengaturan.backup_time || '',
    backup_retention_days: Number(pengaturan.backup_retention_days ?? 30),
  });

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [lastBackup, setLastBackup] = useState(pengaturan.last_backup || null);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState('');

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    const { ok, payload } = await getJson(LIST_BACKUPS_ROUTE);
    if (ok && payload && payload.backups) {
      setAvailableBackups(payload.backups);
      // if none selected, pick the most recent
      if (!selectedBackup && payload.backups.length > 0) {
        setSelectedBackup(payload.backups[0].path);
      }
    } else {
      // Optionally show a toast if listing fails
      // setToast({ type: 'error', message: 'Gagal mengambil daftar backup.' });
    }
  };

  const submit = (e) => {
    e.preventDefault();
    put(route(BACKUP_SETTINGS_ROUTE), {
      preserveScroll: true,
      onSuccess: () => setToast({ type: 'success', message: 'Pengaturan Backup Otomatis berhasil disimpan.' }),
      onError: () => setToast({ type: 'error', message: 'Gagal menyimpan pengaturan. Silakan coba lagi.' }),
    });
  };

  const handleManualBackup = async (e) => {
    e?.preventDefault();
    if (isBackingUp) return;
    setIsBackingUp(true);

    // Try to use Inertia's post if you prefer, but here we use fetch helper to receive JSON directly
    const { ok, payload } = await postJson(MANUAL_BACKUP_ROUTE, {});
    setIsBackingUp(false);

    if (ok && payload && payload.success) {
      setToast({ type: 'success', message: payload.message || 'Backup berhasil.' });
      if (payload.last_backup) setLastBackup(payload.last_backup);
      fetchBackups();
    } else {
      setToast({ type: 'error', message: (payload && payload.message) || 'Backup gagal. Periksa log server.' });
    }
  };

  const handleRestoreDatabase = async (e) => {
    e?.preventDefault();
    if (isRestoring) return;
    if (!selectedBackup) {
      setToast({ type: 'error', message: 'Pilih file backup terlebih dahulu untuk restore.' });
      return;
    }

    const okConfirm = confirm(`Apakah Anda yakin ingin melakukan restore dari file: ${selectedBackup}? Proses ini akan menimpa data saat ini.`);
    if (!okConfirm) return;

    setIsRestoring(true);
    const { ok, payload } = await postJson(RESTORE_ROUTE, { backup: selectedBackup });
    setIsRestoring(false);

    if (ok && payload && payload.success) {
      setToast({ type: 'success', message: payload.message || 'Restore selesai.' });
      // Optionally refresh state after restore
      fetchBackups();
    } else {
      const msg = (payload && payload.message) || 'Restore gagal. Periksa log server.';
      setToast({ type: 'error', message: msg });
    }
  };

  const nextBackupText = () => {
    if (!data.backup_auto_enabled || !data.backup_time) return '-';
    return `Setiap hari pukul ${data.backup_time}`;
  };

  return (
    <section className={`max-w-4xl mx-auto p-4 ${className}`}>
      <header>
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" /> Pengaturan Backup & Restore
        </h2>
        <p className="mt-1 text-sm text-gray-600">Atur jadwal backup otomatis dan kelola backup / restore manual.</p>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`mt-4 p-3 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`} role="status">
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Status Ringkas */}
          <div className="col-span-1 md:col-span-2 bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-md font-semibold text-gray-800">Ringkasan Backup</h3>
                <p className="text-sm text-gray-500">Informasi singkat tentang jadwal dan penyimpanan backup.</p>
              </div>
              <div className="text-sm text-gray-500">Retention: <span className="font-medium text-gray-800">{data.backup_retention_days} hari</span></div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div className="text-xs text-gray-500">Jadwal</div>
                </div>
                <div className="mt-2 font-medium text-gray-800">{nextBackupText()}</div>
              </div>

              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                  <div className="text-xs text-gray-500">Terakhir Backup</div>
                </div>
                <div className="mt-2 font-medium text-gray-800">{lastBackup || '-'}</div>
              </div>

              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <div className="text-xs text-gray-500">Simpan (hari)</div>
                </div>
                <div className="mt-2 font-medium text-gray-800">{data.backup_retention_days}</div>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-3">
                <Checkbox
                  name="backup_auto_enabled"
                  checked={data.backup_auto_enabled}
                  onChange={(e) => setData('backup_auto_enabled', e.target.checked)}
                />
                <div>
                  <div className="font-medium text-gray-800">Aktifkan Backup Otomatis</div>
                  <div className="text-sm text-gray-500">Sistem akan membuat backup sesuai jadwal yang ditentukan.</div>
                </div>
              </label>

              {data.backup_auto_enabled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="backup_time" value="Waktu Backup Harian" />
                    <TextInput
                      id="backup_time"
                      type="time"
                      className="mt-1 block w-full"
                      value={data.backup_time}
                      onChange={(e) => setData('backup_time', e.target.value)}
                      required
                    />
                    <InputError message={errors.backup_time} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="backup_retention_days" value="Simpan Backup Selama (hari)" />
                    <TextInput
                      id="backup_retention_days"
                      type="number"
                      min={1}
                      className="mt-1 block w-full"
                      value={data.backup_retention_days}
                      onChange={(e) => setData('backup_retention_days', Number(e.target.value))}
                      required
                    />
                    <InputError message={errors.backup_retention_days} className="mt-2" />
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-4">
                <PrimaryButton disabled={processing}>Simpan Pengaturan Backup</PrimaryButton>
                {recentlySuccessful && (
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Pengaturan tersimpan.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column kanan: Manual actions */}
          <div className="col-span-1 bg-white border rounded-lg p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-indigo-50 p-2 text-indigo-600"><RefreshCw className="w-5 h-5" /></div>
              <div>
                <h4 className="font-semibold text-gray-800">Backup & Restore</h4>
                <p className="text-sm text-gray-500">Operasi manual untuk membuat backup atau memulihkan database.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <PrimaryButton onClick={handleManualBackup} disabled={isBackingUp}>
                {isBackingUp ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="60" strokeLinecap="round" fill="none" /></svg>
                    Membuat Backup...
                  </div>
                ) : (
                  <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Buat Backup Sekarang</div>
                )}
              </PrimaryButton>

              {/* Backup selection for restore */}
              <div>
                <InputLabel value="Pilih Backup untuk Restore" />
                {availableBackups && availableBackups.length > 0 ? (
                  <select
                    value={selectedBackup}
                    onChange={(e) => setSelectedBackup(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                  >
                    <option value="">-- Pilih backup --</option>
                    {availableBackups.map((b) => (
                      <option key={b.path} value={b.path}>{b.name} — {b.last_modified || '-'}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-500 mt-1">Tidak ada file backup ditemukan.</div>
                )}
              </div>

              <DangerButton onClick={handleRestoreDatabase} disabled={isRestoring}>
                {isRestoring ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="60" strokeLinecap="round" fill="none" /></svg>
                    Memulihkan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2"><Database className="w-4 h-4" /> Restore Database</div>
                )}
              </DangerButton>

              <div className="mt-2 text-sm text-gray-500">Pastikan backup terbaru tersedia sebelum melakukan restore.</div>

              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-md p-3">
                <div className="flex items-start gap-3">
                  <div className="text-amber-600"><AlertTriangle className="w-5 h-5" /></div>
                  <div>
                    <p className="font-medium text-amber-800">Peringatan</p>
                    <p className="text-sm text-amber-700">Operasi restore akan menimpa data saat ini. Lakukan saat jam tidak sibuk.</p>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Catatan: restore otomatis mungkin belum diimplementasikan pada server. Jika backend mengembalikan pesan bahwa restore belum tersedia, lakukan restore manual melalui admin/SSH.
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
