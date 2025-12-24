import React, { useEffect, useMemo, useRef, useState } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import {
  FileUp,
  Filter,
  Clock,
  Eye,
  X,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Ban,
  Loader2,
  ExternalLink,
} from 'lucide-react';

function classNames(...c) {
  return c.filter(Boolean).join(' ');
}

/**
 * IMPORTANT:
 * - Jangan lagi pakai try/catch window.route() untuk cek eksistensi route yang butuh param.
 * - Gunakan Ziggy routes map: window.Ziggy.routes
 */
function routeExists(name) {
  return !!window?.Ziggy?.routes?.[name];
}

function safeRoute(name, params = {}, fallback = '#') {
  try {
    return window.route(name, params);
  } catch (e) {
    return fallback;
  }
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function isProbablyPdf(url = '') {
  const u = String(url).toLowerCase();
  return u.includes('.pdf') || u.includes('application/pdf');
}

function Badge({ status }) {
  const map = {
    Diajukan: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    Disetujui: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    Ditolak: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  };
  const iconMap = {
    Diajukan: <Clock className="h-3.5 w-3.5" />,
    Disetujui: <ShieldCheck className="h-3.5 w-3.5" />,
    Ditolak: <ShieldX className="h-3.5 w-3.5" />,
  };
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        map[status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
      )}
    >
      {iconMap[status] || <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function PillLink({ href, active, children }) {
  return (
    <Link
      href={href}
      preserveScroll
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition',
        active
          ? 'bg-slate-900 text-white ring-slate-900'
          : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
      )}
    >
      {children}
    </Link>
  );
}

function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
              {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-auto p-4">{children}</div>

          {footer && <div className="border-t border-slate-100 px-4 py-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function AttachmentViewer({ row }) {
  const url = row?.view_url || row?.preview_url || row?.download_url || null;

  if (!url) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Tidak ada lampiran.
      </div>
    );
  }

  if (isProbablyPdf(url)) {
    return (
      <iframe
        title="Preview PDF"
        src={url}
        className="h-[70vh] w-full rounded-xl ring-1 ring-slate-200"
      />
    );
  }

  return (
    <img src={url} alt="Lampiran" className="w-full rounded-xl ring-1 ring-slate-200" />
  );
}

function Dropzone({
  value,
  onChange,
  error,
  hint = 'PDF/JPG/PNG maks 2MB',
  accept = '.pdf,.jpg,.jpeg,.png',
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const file = value ?? null;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const isImage = file.type?.startsWith('image/');
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const pick = () => inputRef.current?.click();

  const clear = () => {
    onChange(null);
    setPreviewOpen(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onChange(f);
  };

  const canPreview =
    !!file &&
    (previewUrl || file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'));

  return (
    <>
      <div
        onClick={pick}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={onDrop}
        className={classNames(
          'group relative cursor-pointer rounded-2xl border-2 border-dashed p-4 transition',
          dragActive ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50',
          error ? 'border-rose-300 bg-rose-50/50' : ''
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />

        {!file ? (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <FileUp className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">Upload lampiran</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Drag & drop di sini, atau <span className="font-semibold text-sky-700">klik untuk pilih file</span>.
              </div>
              <div className="text-[11px] text-slate-500 mt-2">{hint}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div
              className={classNames(
                'mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5',
                previewUrl ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white'
              )}
            >
              {previewUrl ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{file.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {file.type || 'file'} • {formatBytes(file.size)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canPreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" /> Lihat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clear();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    title="Hapus file"
                  >
                    <X className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </div>

              {previewUrl && (
                <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-slate-50">
                  <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
      </div>

      {error && <div className="mt-2 text-xs text-rose-600">{error}</div>}

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={file?.name || 'Lampiran'}
        subtitle="Preview lampiran sebelum dikirim"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full rounded-xl ring-1 ring-slate-200" />
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              File ini bukan gambar. Preview langsung kadang terbatas — tapi aman, file tetap akan ikut terkirim.
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">{file?.name}</div>
              <div className="text-xs text-slate-600 mt-1">
                {file?.type || 'file'} • {formatBytes(file?.size || 0)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <CalendarDays className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">Belum ada pengajuan</div>
      <div className="mt-1 text-sm text-slate-600">
        Buat pengajuan izin/sakit untuk melihat riwayat di sini.
      </div>
    </div>
  );
}

export default function Index() {
  const { siswa, izin, filters, flash } = usePage().props;

  const form = useForm({
    jenis_izin: 'Izin',
    tanggal_mulai_izin: '',
    tanggal_selesai_izin: '',
    keterangan: '',
    file_lampiran: null,
  });

  const cancelForm = useForm({});
  const [viewRow, setViewRow] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);

  const canSubmit = useMemo(() => {
    const ket = (form.data.keterangan || '').trim();
    const start = form.data.tanggal_mulai_izin;
    const end = form.data.tanggal_selesai_izin;
    return !!start && !!end && ket.length >= 5;
  }, [form.data]);

  const submit = (e) => {
    e.preventDefault();
    form.post(safeRoute('orangtua.surat-izin.store'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => form.reset('keterangan', 'file_lampiran'),
    });
  };

  const canCancelRoute = routeExists('orangtua.surat-izin.cancel');

  // FIX UTAMA: route cancel pakai {surat} => kirim params object { surat: id_surat }
  const doCancel = () => {
    if (!cancelRow) return;

    cancelForm.post(safeRoute('orangtua.surat-izin.cancel', { surat: cancelRow.id_surat }), {
      preserveScroll: true,
      onFinish: () => setCancelRow(null),
    });
  };

  const currentStatus = filters?.status || 'Semua';
  const currentJenis = filters?.jenis || 'Semua';

  if (!siswa) {
    return (
      <OrangTuaLayout header="Pengajuan Surat Izin">
        <Head title="Pengajuan Surat Izin" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Siswa belum terhubung</div>
          <div className="text-sm text-slate-600 mt-1">
            Akun orang tua ini belum terhubung dengan data siswa.
          </div>
        </div>
      </OrangTuaLayout>
    );
  }

  return (
    <OrangTuaLayout header="Pengajuan Surat Izin">
      <Head title="Pengajuan Surat Izin" />

      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* HERO */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-slate-900">Pengajuan Izin / Sakit</div>
              <div className="text-sm text-slate-600">
                Untuk ananda: <span className="font-semibold">{siswa?.nama_lengkap}</span>
              </div>

              {(flash?.success || flash?.error) && (
                <div className="mt-3">
                  {flash?.success && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-semibold">Berhasil:</span> {flash.success}
                    </div>
                  )}
                  {flash?.error && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-semibold">Gagal:</span> {flash.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                <Filter className="h-4 w-4" />
                Filter cepat:
              </div>

              <PillLink
                href={safeRoute('orangtua.surat-izin.index', { status: 'Semua', jenis: 'Semua' })}
                active={currentStatus === 'Semua' && currentJenis === 'Semua'}
              >
                Semua
              </PillLink>

              <PillLink
                href={safeRoute('orangtua.surat-izin.index', { status: 'Diajukan', jenis: currentJenis })}
                active={currentStatus === 'Diajukan'}
              >
                <Clock className="h-4 w-4" /> Diajukan
              </PillLink>

              <PillLink
                href={safeRoute('orangtua.surat-izin.index', { status: 'Disetujui', jenis: currentJenis })}
                active={currentStatus === 'Disetujui'}
              >
                <ShieldCheck className="h-4 w-4" /> Disetujui
              </PillLink>

              <PillLink
                href={safeRoute('orangtua.surat-izin.index', { status: 'Ditolak', jenis: currentJenis })}
                active={currentStatus === 'Ditolak'}
              >
                <ShieldX className="h-4 w-4" /> Ditolak
              </PillLink>

              <Link
                href={safeRoute('orangtua.surat-izin.index', { status: 'Semua', jenis: 'Semua' })}
                preserveScroll
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Reset
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* FORM */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-slate-900">Buat Pengajuan</div>
                <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                  <FileUp className="h-4 w-4" /> Lampiran opsional
                </span>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                Isi tanggal, alasan singkat, dan (opsional) bukti. Status keputusan tampil di riwayat.
              </div>

              <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Jenis</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => form.setData('jenis_izin', 'Izin')}
                      className={classNames(
                        'rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 transition',
                        form.data.jenis_izin === 'Izin'
                          ? 'bg-slate-900 text-white ring-slate-900'
                          : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                      )}
                    >
                      Izin
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setData('jenis_izin', 'Sakit')}
                      className={classNames(
                        'rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 transition',
                        form.data.jenis_izin === 'Sakit'
                          ? 'bg-rose-600 text-white ring-rose-600'
                          : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                      )}
                    >
                      Sakit
                    </button>
                  </div>
                  {form.errors.jenis_izin && <div className="mt-2 text-xs text-rose-600">{form.errors.jenis_izin}</div>}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Mulai</label>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={form.data.tanggal_mulai_izin}
                      onChange={(e) => form.setData('tanggal_mulai_izin', e.target.value)}
                    />
                    {form.errors.tanggal_mulai_izin && (
                      <div className="mt-2 text-xs text-rose-600">{form.errors.tanggal_mulai_izin}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Selesai</label>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={form.data.tanggal_selesai_izin}
                      onChange={(e) => form.setData('tanggal_selesai_izin', e.target.value)}
                      min={form.data.tanggal_mulai_izin || undefined}
                    />
                    {form.errors.tanggal_selesai_izin && (
                      <div className="mt-2 text-xs text-rose-600">{form.errors.tanggal_selesai_izin}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Keterangan</label>
                  <textarea
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={form.data.keterangan}
                    onChange={(e) => form.setData('keterangan', e.target.value)}
                    placeholder="Contoh: demam, kontrol dokter, urusan keluarga, dll..."
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div
                      className={classNames(
                        'inline-flex items-center gap-2',
                        (form.data.keterangan || '').trim().length < 5 ? 'text-slate-500' : 'text-emerald-700'
                      )}
                    >
                      {(form.data.keterangan || '').trim().length < 5 ? (
                        <>
                          <AlertTriangle className="h-4 w-4" /> Minimal 5 karakter
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" /> Oke
                        </>
                      )}
                    </div>
                    <div className="text-slate-500">{(form.data.keterangan || '').length}/500</div>
                  </div>
                  {form.errors.keterangan && <div className="mt-2 text-xs text-rose-600">{form.errors.keterangan}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Lampiran (opsional)</label>
                  <div className="mt-2">
                    <Dropzone
                      value={form.data.file_lampiran}
                      onChange={(f) => form.setData('file_lampiran', f)}
                      error={form.errors.file_lampiran}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || form.processing}
                  className={classNames(
                    'w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    !canSubmit || form.processing
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400'
                  )}
                >
                  {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {form.processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>

                <div className="text-[11px] text-slate-500">
                  Setelah dikirim, tunggu persetujuan. Kalau masih <b>Diajukan</b>, bisa dibatalkan.
                </div>
              </form>
            </div>
          </div>

          {/* LIST */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-900">Riwayat Pengajuan</div>
                  <div className="text-sm text-slate-600">
                    Total: <span className="font-semibold">{izin?.total ?? (izin?.data?.length ?? 0)}</span>
                  </div>
                </div>

                <Link
                  href={safeRoute('orangtua.surat-izin.index', { status: 'Semua', jenis: 'Semua' })}
                  preserveScroll
                  className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  <Filter className="h-4 w-4" /> Reset filter
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {(izin?.data || []).map((row) => {
                  const canCancel = row.status_pengajuan === 'Diajukan';
                  const cancelDisabled = !canCancel || !canCancelRoute || cancelForm.processing;

                  return (
                    <div
                      key={row.id_surat}
                      className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50/60 transition"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">
                              {row.jenis_izin} • {row.tanggal_mulai_izin} → {row.tanggal_selesai_izin}
                            </div>
                            <Badge status={row.status_pengajuan} />
                            <span
                              className={classNames(
                                'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ring-1',
                                row.view_url || row.download_url || row.preview_url
                                  ? 'bg-sky-50 text-sky-700 ring-sky-200'
                                  : 'bg-slate-50 text-slate-600 ring-slate-200'
                              )}
                            >
                              {row.view_url || row.download_url || row.preview_url ? 'Lampiran: Ada' : 'Lampiran: -'}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Diajukan: {row.tanggal_pengajuan}
                            {row.tanggal_persetujuan ? ` • Diputuskan: ${row.tanggal_persetujuan}` : ''}
                          </div>

                          {row.keterangan && (
                            <div className="mt-3 text-sm text-slate-700 leading-relaxed">
                              {row.keterangan}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* VIEW SURAT */}
                          <button
                            type="button"
                            onClick={() => setViewRow(row)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" /> View Surat
                          </button>

                          {/* CANCEL */}
                          <button
                            type="button"
                            disabled={cancelDisabled}
                            onClick={() => setCancelRow(row)}
                            className={classNames(
                              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition',
                              cancelDisabled
                                ? 'bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed'
                                : 'bg-white text-rose-700 ring-rose-200 hover:bg-rose-50'
                            )}
                            title={
                              !canCancel
                                ? 'Hanya bisa dibatalkan saat status Diajukan'
                                : !canCancelRoute
                                ? 'Route orangtua.surat-izin.cancel belum tersedia'
                                : 'Batalkan pengajuan'
                            }
                          >
                            {cancelForm.processing && cancelRow?.id_surat === row.id_surat ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                            Batalkan
                          </button>
                        </div>
                      </div>

                      {row.status_pengajuan === 'Disetujui' && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-200">
                          <ShieldCheck className="h-4 w-4" />
                          Pengajuan disetujui.
                        </div>
                      )}
                      {row.status_pengajuan === 'Ditolak' && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-200">
                          <ShieldX className="h-4 w-4" />
                          Pengajuan ditolak.
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!izin?.data || izin.data.length === 0) && <EmptyState />}
              </div>

              {/* pagination */}
              {izin?.links && izin.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {izin.links.map((l, idx) => (
                    <Link
                      key={idx}
                      href={l.url || '#'}
                      preserveScroll
                      className={classNames(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold ring-1 ring-slate-200 transition',
                        l.active ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50',
                        !l.url && 'opacity-40 pointer-events-none'
                      )}
                      dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SURAT MODAL */}
      <Modal
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow ? `Surat Izin #${viewRow.id_surat}` : 'Surat Izin'}
        subtitle={viewRow ? `${viewRow.jenis_izin} • ${viewRow.tanggal_mulai_izin} → ${viewRow.tanggal_selesai_izin}` : ''}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              {viewRow?.status_pengajuan === 'Diajukan' && 'Status masih Diajukan — masih bisa dibatalkan.'}
              {viewRow?.status_pengajuan === 'Disetujui' && 'Status Disetujui.'}
              {viewRow?.status_pengajuan === 'Ditolak' && 'Status Ditolak.'}
            </div>

            {(viewRow?.view_url || viewRow?.download_url) && (
              <a
                href={viewRow.view_url || viewRow.download_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Buka di tab baru
              </a>
            )}
          </div>
        }
      >
        {viewRow && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={viewRow.status_pengajuan} />
              <span className="text-xs text-slate-500">
                Diajukan: <span className="font-semibold text-slate-700">{viewRow.tanggal_pengajuan}</span>
              </span>
              {viewRow.tanggal_persetujuan && (
                <span className="text-xs text-slate-500">
                  Diputuskan: <span className="font-semibold text-slate-700">{viewRow.tanggal_persetujuan}</span>
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-900">Keterangan</div>
              <div className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewRow.keterangan || '-'}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-900">Lampiran</div>
              <div className="mt-3">
                <AttachmentViewer row={viewRow} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL CONFIRM MODAL */}
      <Modal
        open={!!cancelRow}
        onClose={() => (cancelForm.processing ? null : setCancelRow(null))}
        title="Batalkan pengajuan?"
        subtitle={
          cancelRow
            ? `#${cancelRow.id_surat} • ${cancelRow.jenis_izin} • ${cancelRow.tanggal_mulai_izin} → ${cancelRow.tanggal_selesai_izin}`
            : ''
        }
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={cancelForm.processing}
              onClick={() => setCancelRow(null)}
              className={classNames(
                'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition',
                cancelForm.processing
                  ? 'bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
              )}
            >
              Tidak
            </button>

            <button
              type="button"
              disabled={cancelForm.processing || !canCancelRoute}
              onClick={doCancel}
              className={classNames(
                'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                cancelForm.processing || !canCancelRoute
                  ? 'bg-rose-100 text-rose-300 cursor-not-allowed'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              )}
              title={!canCancelRoute ? 'Route orangtua.surat-izin.cancel belum ada' : 'Konfirmasi pembatalan'}
            >
              {cancelForm.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Ya, Batalkan
            </button>
          </div>
        }
      >
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
          Pengajuan yang dibatalkan tidak akan diproses oleh admin. Kalau perlu, kamu bisa buat pengajuan baru.
        </div>

        {!canCancelRoute && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
            Tombol batal butuh route <b>orangtua.surat-izin.cancel</b>. Saat ini belum terdeteksi oleh Ziggy.
          </div>
        )}
      </Modal>
    </OrangTuaLayout>
  );
}
