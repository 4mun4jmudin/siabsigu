import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PaperClipIcon,
  PhotoIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

/**
 * Props dari controller:
 * - auth
 * - siswa: Array<{ id_siswa, nis, nama_lengkap, foto_profil? }>
 * - defaults: { tanggal_mulai_izin, tanggal_selesai_izin, jenis_izin, langsung_setujui }
 */
export default function Create({ auth, siswa = [], defaults = {} }) {
  const [query, setQuery] = useState("");

  // ====== Upload UI state (UI only) ======
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null); // blob preview
  const [localFileError, setLocalFileError] = useState(null);

  // Form Inertia (tetap sama)
  const { data, setData, post, processing, errors, reset } = useForm({
    id_siswa: "",
    jenis_izin: defaults.jenis_izin ?? "Izin",
    tanggal_mulai_izin: defaults.tanggal_mulai_izin ?? new Date().toISOString().slice(0, 10),
    tanggal_selesai_izin: defaults.tanggal_selesai_izin ?? new Date().toISOString().slice(0, 10),
    keterangan: "",
    file_lampiran: null,
    langsung_setujui: Boolean(defaults.langsung_setujui) ?? false,
  });

  // Cleanup preview blob
  useEffect(() => {
    return () => {
      if (filePreviewUrl && String(filePreviewUrl).startsWith("blob:")) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Filter sederhana di sisi-klien: nama/nis (tetap sama)
  const filteredSiswa = useMemo(() => {
    if (!query?.trim()) return siswa;
    const q = query.toLowerCase();
    return (siswa || []).filter(
      (s) =>
        s?.nama_lengkap?.toLowerCase().includes(q) ||
        s?.nis?.toString().toLowerCase().includes(q)
    );
  }, [query, siswa]);

  // Selected siswa card (UI aja)
  const selectedSiswa = useMemo(() => {
    if (!data.id_siswa) return null;
    return (siswa || []).find((s) => String(s.id_siswa) === String(data.id_siswa)) || null;
  }, [data.id_siswa, siswa]);

  // Hitung durasi hari (inklusif) (tetap sama)
  const daysInclusive = useMemo(() => {
    if (!data.tanggal_mulai_izin || !data.tanggal_selesai_izin) return 0;
    const d1 = new Date(data.tanggal_mulai_izin + "T00:00:00");
    const d2 = new Date(data.tanggal_selesai_izin + "T00:00:00");
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? 0 : diff + 1;
  }, [data.tanggal_mulai_izin, data.tanggal_selesai_izin]);

  const bytesToSize = (bytes) => {
    if (!bytes && bytes !== 0) return "-";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };

  const isImage = (file) => !!file?.type?.startsWith("image/");
  const isPdf = (file) => file?.type === "application/pdf";

  const setFileLampiran = (file) => {
    setLocalFileError(null);

    if (!file) {
      setData("file_lampiran", null);
      if (filePreviewUrl && String(filePreviewUrl).startsWith("blob:")) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
      return;
    }

    const allowedExt = [".jpg", ".jpeg", ".png", ".pdf"];
    const name = (file.name || "").toLowerCase();
    const okExt = allowedExt.some((ext) => name.endsWith(ext));
    const okSize = file.size <= 2 * 1024 * 1024;

    if (!okExt) {
      setLocalFileError("Format tidak didukung. Gunakan JPG, PNG, atau PDF.");
      return;
    }
    if (!okSize) {
      setLocalFileError("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    setData("file_lampiran", file);

    // preview blob (image/pdf)
    if (filePreviewUrl && String(filePreviewUrl).startsWith("blob:")) URL.revokeObjectURL(filePreviewUrl);
    if (isImage(file) || isPdf(file)) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const clearFile = () => {
    setFileLampiran(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.surat-izin.store"), {
      forceFormData: true, // penting untuk upload file
      onSuccess: () => {
        reset();
        clearFile();
        setQuery("");
      },
    });
  };

  // Drag n drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFileLampiran(f);
  };

  return (
    <AdminLayout user={auth.user} header="Buat Surat Izin (Admin)">
      <Head title="Buat Surat Izin" />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Buat Surat Izin</h1>
              <p className="text-sm text-slate-500 mt-1">
                Pengajuan oleh admin — bisa langsung disetujui & otomatis sinkron ke absensi.
              </p>
            </div>
            <Link
              href={route("admin.surat-izin.index")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 w-fit"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Kembali ke daftar
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-6">
          {/* PILIH SISWA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <div className="flex items-center justify-between">
                <InputLabel value="Cari Siswa (Nama / NIS)" />
                <span className="text-xs text-slate-400">
                  {filteredSiswa.length}/{siswa.length}
                </span>
              </div>
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik untuk menyaring pilihan..."
                className="mt-1 block w-full"
              />
              <p className="mt-2 text-xs text-slate-500">
                Tips: ketik <b>nis</b> atau <b>nama</b> biar cepet.
              </p>
            </div>

            <div className="lg:col-span-7">
              <InputLabel htmlFor="id_siswa" value="Pilih Siswa" />
              <select
                id="id_siswa"
                value={data.id_siswa}
                onChange={(e) => setData("id_siswa", e.target.value)}
                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">— pilih siswa —</option>
                {filteredSiswa.map((s) => (
                  <option key={s.id_siswa} value={s.id_siswa}>
                    {s.nama_lengkap} {s.nis ? `(${s.nis})` : ""}
                  </option>
                ))}
              </select>
              <InputError message={errors.id_siswa} className="mt-2" />

              {/* Selected siswa preview (UI aja) */}
              {selectedSiswa && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-white border border-slate-200 grid place-items-center">
                    {selectedSiswa?.foto_url ? (
                      <img
                        src={selectedSiswa.foto_url}
                        alt="Foto siswa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">S</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 truncate">
                      {selectedSiswa.nama_lengkap}
                    </div>
                    <div className="text-xs text-slate-500">
                      NIS: <span className="font-semibold">{selectedSiswa.nis || "-"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* JENIS + TANGGAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <InputLabel htmlFor="jenis_izin" value="Jenis Izin" />
              <select
                id="jenis_izin"
                value={data.jenis_izin}
                onChange={(e) => setData("jenis_izin", e.target.value)}
                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
              </select>
              <InputError message={errors.jenis_izin} className="mt-2" />
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <InputLabel htmlFor="tanggal_mulai_izin" value="Tanggal Mulai" />
                  <TextInput
                    id="tanggal_mulai_izin"
                    type="date"
                    value={data.tanggal_mulai_izin}
                    onChange={(e) => setData("tanggal_mulai_izin", e.target.value)}
                    className="mt-1 block w-full"
                  />
                  <InputError message={errors.tanggal_mulai_izin} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="tanggal_selesai_izin" value="Tanggal Selesai" />
                  <TextInput
                    id="tanggal_selesai_izin"
                    type="date"
                    value={data.tanggal_selesai_izin}
                    onChange={(e) => setData("tanggal_selesai_izin", e.target.value)}
                    className="mt-1 block w-full"
                  />
                  <InputError message={errors.tanggal_selesai_izin} className="mt-2" />
                  <p className="mt-2 text-xs text-slate-500">
                    Periode: <span className="font-semibold">{Math.max(daysInclusive, 0)} hari</span> (inklusif)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KETERANGAN */}
          <div>
            <InputLabel htmlFor="keterangan" value="Keterangan" />
            <textarea
              id="keterangan"
              value={data.keterangan}
              onChange={(e) => setData("keterangan", e.target.value)}
              rows={4}
              placeholder="Contoh: izin menghadiri acara keluarga / sakit disertai surat dokter, dll."
              className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <InputError message={errors.keterangan} className="mt-2" />
          </div>

          {/* LAMPIRAN - UI UPGRADE */}
          <div>
            <div className="flex items-center justify-between">
              <InputLabel htmlFor="file_lampiran" value="Lampiran (opsional)" />
              <span className="text-xs text-slate-400">Maks 2MB • JPG/PNG/PDF</span>
            </div>

            <div className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Dropzone */}
              <div className="lg:col-span-7">
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`rounded-2xl border-2 border-dashed p-4 sm:p-5 transition ${
                    dragActive
                      ? "border-indigo-400 bg-indigo-50/60"
                      : "border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 grid place-items-center">
                      <PaperClipIcon className="h-6 w-6 text-slate-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900">
                        Tarik & lepas file di sini
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        atau pilih file manual. Setelah dipilih, kamu bisa lihat preview di samping.
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                        >
                          <PaperClipIcon className="w-5 h-5 mr-2" />
                          Pilih File
                        </button>

                        {data.file_lampiran && (
                          <button
                            type="button"
                            onClick={clearFile}
                            className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
                          >
                            <XMarkIcon className="w-5 h-5 mr-2 text-slate-500" />
                            Hapus
                          </button>
                        )}

                        <input
                          ref={fileInputRef}
                          id="file_lampiran"
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setFileLampiran(e.target.files?.[0] ?? null)}
                        />
                      </div>

                      {/* file name */}
                      <div className="mt-3 text-sm text-slate-700 truncate">
                        {data.file_lampiran ? (
                          <>
                            <span className="font-semibold">Terpilih:</span>{" "}
                            {data.file_lampiran.name}
                            <span className="text-slate-500"> • {bytesToSize(data.file_lampiran.size)}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Tidak ada file terpilih.</span>
                        )}
                      </div>

                      {/* errors */}
                      {(localFileError || errors.file_lampiran) && (
                        <div className="mt-2">
                          <InputError message={localFileError || errors.file_lampiran} />
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-400">
                        Format: JPG, PNG, atau PDF. (Bukan .zip ya bro 😄)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview panel */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900">Preview</div>
                      <div className="text-xs text-slate-500">
                        {data.file_lampiran ? (isPdf(data.file_lampiran) ? "PDF" : isImage(data.file_lampiran) ? "Gambar" : "File") : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {!data.file_lampiran ? (
                      <div className="h-52 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center text-center p-6">
                        <PhotoIcon className="h-10 w-10 text-slate-300" />
                        <div className="mt-2 text-sm font-semibold text-slate-500">Belum ada lampiran</div>
                        <div className="text-xs text-slate-400">Pilih file untuk melihat preview.</div>
                      </div>
                    ) : isImage(data.file_lampiran) && filePreviewUrl ? (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <img
                          src={filePreviewUrl}
                          alt="Preview lampiran"
                          className="w-full h-52 object-cover"
                        />
                      </div>
                    ) : isPdf(data.file_lampiran) && filePreviewUrl ? (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <iframe
                          title="Preview PDF"
                          src={filePreviewUrl}
                          className="w-full h-52"
                        />
                      </div>
                    ) : (
                      <div className="h-52 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center text-center p-6">
                        <DocumentTextIcon className="h-10 w-10 text-slate-300" />
                        <div className="mt-2 text-sm font-semibold text-slate-600">File terpilih</div>
                        <div className="text-xs text-slate-400 break-all">{data.file_lampiran.name}</div>
                      </div>
                    )}

                    {data.file_lampiran && (
                      <div className="mt-3 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Ukuran</span>
                          <span className="font-semibold">{bytesToSize(data.file_lampiran.size)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-slate-500">Tipe</span>
                          <span className="font-semibold">{data.file_lampiran.type || "-"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LANGSUNG SETUJUI */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start gap-3">
              <input
                id="langsung_setujui"
                type="checkbox"
                checked={data.langsung_setujui}
                onChange={(e) => setData("langsung_setujui", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="min-w-0">
                <label htmlFor="langsung_setujui" className="font-extrabold text-slate-900">
                  Setujui langsung & sinkron ke absensi
                </label>
                <p className="text-xs text-slate-600 mt-1">
                  Jika dicentang, status pengajuan menjadi <b>Disetujui</b> dan kehadiran siswa pada rentang tanggal akan di-set ke
                  <b> {data.jenis_izin}</b>.
                </p>
              </div>
            </div>
          </div>

          {/* ACTION */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <SecondaryButton as="a" href={route("admin.surat-izin.index")} disabled={processing}>
              Batal
            </SecondaryButton>
            <PrimaryButton disabled={processing}>
              {processing ? (
                "Menyimpan..."
              ) : (
                <span className="inline-flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Simpan Surat
                </span>
              )}
            </PrimaryButton>
          </div>
        </form>

        {/* Bantuan jika daftar kosong */}
        {(!siswa || siswa.length === 0) && (
          <div className="text-center text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            Daftar siswa kosong. Pastikan data siswa berstatus <b>Aktif</b> dan controller <code>create()</code> mengirimkan kolom
            <code> id_siswa, nis, nama_lengkap, foto_profil</code>.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
