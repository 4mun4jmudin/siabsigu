import React, { useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { ArrowLeftIcon, CheckCircleIcon, PaperClipIcon } from "@heroicons/react/24/solid";

/**
 * Props dari controller:
 * - auth
 * - siswa: Array<{ id_siswa, nis, nama_lengkap, foto_profil? }>
 * - defaults: { tanggal_mulai_izin, tanggal_selesai_izin, jenis_izin, langsung_setujui }
 */
export default function Create({ auth, siswa = [], defaults = {} }) {
  const [query, setQuery] = useState("");

  // Form Inertia
  const { data, setData, post, processing, errors, reset } = useForm({
    id_siswa: "",
    jenis_izin: defaults.jenis_izin ?? "Izin",
    tanggal_mulai_izin: defaults.tanggal_mulai_izin ?? new Date().toISOString().slice(0, 10),
    tanggal_selesai_izin: defaults.tanggal_selesai_izin ?? new Date().toISOString().slice(0, 10),
    keterangan: "",
    file_lampiran: null,
    langsung_setujui: Boolean(defaults.langsung_setujui) ?? false,
  });

  // Filter sederhana di sisi-klien: nama/nis
  const filteredSiswa = useMemo(() => {
    if (!query?.trim()) return siswa;
    const q = query.toLowerCase();
    return (siswa || []).filter(
      (s) =>
        s?.nama_lengkap?.toLowerCase().includes(q) ||
        s?.nis?.toString().toLowerCase().includes(q)
    );
  }, [query, siswa]);

  // Hitung durasi hari (inklusif)
  const daysInclusive = useMemo(() => {
    if (!data.tanggal_mulai_izin || !data.tanggal_selesai_izin) return 0;
    const d1 = new Date(data.tanggal_mulai_izin + "T00:00:00");
    const d2 = new Date(data.tanggal_selesai_izin + "T00:00:00");
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? 0 : diff + 1;
  }, [data.tanggal_mulai_izin, data.tanggal_selesai_izin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.surat-izin.store"), {
      forceFormData: true, // penting untuk upload file
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <AdminLayout user={auth.user} header="Buat Surat Izin (Admin)">
      <Head title="Buat Surat Izin" />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Buat Surat Izin</h1>
            <p className="text-sm text-gray-500">Pengajuan oleh admin — dapat langsung disetujui & otomatis sinkron ke absensi.</p>
          </div>
          <Link
            href={route("admin.surat-izin.index")}
            className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Kembali ke daftar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* PILIH SISWA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <InputLabel value="Cari Siswa (Nama / NIS)" />
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik untuk menyaring pilihan..."
                className="mt-1 block w-full"
              />
              <p className="mt-1 text-xs text-gray-400">
                Menyaring {filteredSiswa.length} dari {siswa.length} siswa.
              </p>
            </div>

            <div>
              <InputLabel htmlFor="id_siswa" value="Pilih Siswa" />
              <select
                id="id_siswa"
                value={data.id_siswa}
                onChange={(e) => setData("id_siswa", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">— pilih siswa —</option>
                {filteredSiswa.map((s) => (
                  <option key={s.id_siswa} value={s.id_siswa}>
                    {s.nama_lengkap} {s.nis ? `(${s.nis})` : ""}
                  </option>
                ))}
              </select>
              <InputError message={errors.id_siswa} className="mt-2" />
            </div>

            {/* JENIS IZIN */}
            <div>
              <InputLabel htmlFor="jenis_izin" value="Jenis Izin" />
              <select
                id="jenis_izin"
                value={data.jenis_izin}
                onChange={(e) => setData("jenis_izin", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
              </select>
              <InputError message={errors.jenis_izin} className="mt-2" />
            </div>

            {/* TANGGAL MULAI / SELESAI */}
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
                <p className="mt-1 text-xs text-gray-500">
                  Periode: <span className="font-medium">{Math.max(daysInclusive, 0)} hari</span> (inklusif)
                </p>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <InputError message={errors.keterangan} className="mt-2" />
          </div>

          {/* LAMPIRAN */}
          <div>
            <InputLabel htmlFor="file_lampiran" value="Lampiran (opsional)" />
            <div className="mt-1 flex items-center gap-3">
              <label
                htmlFor="file_lampiran"
                className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-pointer hover:bg-indigo-100"
              >
                <PaperClipIcon className="w-5 h-5 mr-2" />
                Pilih File
              </label>
              <input
                id="file_lampiran"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setData("file_lampiran", e.target.files?.[0] ?? null)}
              />
              <div className="text-sm text-gray-600 truncate">
                {data.file_lampiran ? data.file_lampiran.name : "Tidak ada file terpilih."}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">Maks 2MB. Format: JPG, PNG, atau PDF.</p>
            <InputError message={errors.file_lampiran} className="mt-2" />
          </div>

          {/* LANGSUNG SETUJUI */}
          <div className="flex items-start gap-3">
            <input
              id="langsung_setujui"
              type="checkbox"
              checked={data.langsung_setujui}
              onChange={(e) => setData("langsung_setujui", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="langsung_setujui" className="font-medium text-gray-800">
                Setujui langsung & sinkron ke absensi
              </label>
              <p className="text-xs text-gray-500">
                Jika dicentang, status pengajuan menjadi <b>Disetujui</b> dan kehadiran siswa pada rentang tanggal akan di-set ke
                <b> {data.jenis_izin}</b>.
              </p>
            </div>
          </div>

          {/* ACTION */}
          <div className="flex items-center justify-end gap-3">
            <SecondaryButton as="a" href={route("admin.surat-izin.index")} disabled={processing}>
              Batal
            </SecondaryButton>
            <PrimaryButton disabled={processing}>
              {processing ? "Menyimpan..." : (
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
          <div className="text-center text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Daftar siswa kosong. Pastikan data siswa berstatus <b>Aktif</b> dan controller <code>create()</code> mengirimkan kolom
            <code> id_siswa, nis, nama_lengkap, foto_profil</code>.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
