import React, { useEffect, useMemo, useState } from "react";

export default function SiswaForm({ data, setData, errors = {}, kelasOptions = [], siswa = null }) {
  // Preview prioritas:
  // 1) file baru yg dipilih
  // 2) siswa.foto_url (kalau backend ngirim)
  // 3) fallback /storage/<path> (kalau format lama)
  // 4) ui-avatars
  const initialPreview = useMemo(() => {
    if (siswa?.foto_url) return siswa.foto_url;
    if (siswa?.foto_profil) return `/storage/${siswa.foto_profil}`;
    return null;
  }, [siswa]);

  const [preview, setPreview] = useState(initialPreview);
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    setPreview(initialPreview);
  }, [initialPreview]);

  // cleanup object URL biar gak bocor memory
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setData("foto_profil", file);

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setPreview(url);
  };

  const agamaOptions = [
    "Islam",
    "Kristen Protestan",
    "Katolik",
    "Hindu",
    "Buddha",
    "Khonghucu",
    "Lainnya",
  ];

  const avatarFallback = useMemo(() => {
    const name = encodeURIComponent(data.nama_lengkap || "S");
    return `https://ui-avatars.com/api/?name=${name}&color=7F9CF5&background=EBF4FF&size=256`;
  }, [data.nama_lengkap]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
      {/* Kolom Kiri - Foto Profil */}
      <div className="md:col-span-1">
        <h3 className="text-lg font-medium text-gray-900">Foto Profil Siswa</h3>
        <p className="mt-1 text-sm text-gray-600">Upload foto profil siswa (opsional).</p>

        <div className="mt-4">
          <div className="w-40 h-40 bg-gray-100 rounded-full mx-auto overflow-hidden ring-1 ring-gray-200">
            <img
              src={preview || avatarFallback}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = avatarFallback;
              }}
            />
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {errors.foto_profil && <p className="text-red-500 text-xs mt-1">{errors.foto_profil}</p>}
        </div>
      </div>

      {/* Kolom Kanan - Detail Informasi */}
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Data Akademik */}
          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900">Data Akademik</h3>
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              ID Siswa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.id_siswa}
              onChange={(e) => setData("id_siswa", e.target.value)}
              disabled={!!siswa}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
            />
            {errors.id_siswa && <p className="text-red-500 text-xs mt-1">{errors.id_siswa}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              NIS <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nis}
              onChange={(e) => setData("nis", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.nis && <p className="text-red-500 text-xs mt-1">{errors.nis}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              NISN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nisn}
              onChange={(e) => setData("nisn", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.nisn && <p className="text-red-500 text-xs mt-1">{errors.nisn}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              Kelas <span className="text-red-500">*</span>
            </label>
            <select
              value={data.id_kelas}
              onChange={(e) => setData("id_kelas", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Pilih Kelas</option>
              {kelasOptions.map((kelas) => (
                <option key={kelas.id_kelas} value={kelas.id_kelas}>
                  {kelas.tingkat} {kelas.jurusan}
                </option>
              ))}
            </select>
            {errors.id_kelas && <p className="text-red-500 text-xs mt-1">{errors.id_kelas}</p>}
          </div>

          {/* Data Pribadi */}
          <div className="sm:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900">Data Pribadi</h3>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-sm text-gray-700">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nama_lengkap}
              onChange={(e) => setData("nama_lengkap", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.nama_lengkap && <p className="text-red-500 text-xs mt-1">{errors.nama_lengkap}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              Tempat Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.tempat_lahir}
              onChange={(e) => setData("tempat_lahir", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.tempat_lahir && <p className="text-red-500 text-xs mt-1">{errors.tempat_lahir}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              Tanggal Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.tanggal_lahir}
              onChange={(e) => setData("tanggal_lahir", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.tanggal_lahir && <p className="text-red-500 text-xs mt-1">{errors.tanggal_lahir}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              value={data.jenis_kelamin}
              onChange={(e) => setData("jenis_kelamin", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              Agama <span className="text-red-500">*</span>
            </label>
            <select
              value={data.agama}
              onChange={(e) => setData("agama", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              {agamaOptions.map((agama) => (
                <option key={agama} value={agama}>
                  {agama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              NIK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nik}
              onChange={(e) => setData("nik", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik}</p>}
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700">
              Nomor KK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nomor_kk}
              onChange={(e) => setData("nomor_kk", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.nomor_kk && <p className="text-red-500 text-xs mt-1">{errors.nomor_kk}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-sm text-gray-700">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              value={data.alamat_lengkap}
              onChange={(e) => setData("alamat_lengkap", e.target.value)}
              rows="3"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
            {errors.alamat_lengkap && <p className="text-red-500 text-xs mt-1">{errors.alamat_lengkap}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
