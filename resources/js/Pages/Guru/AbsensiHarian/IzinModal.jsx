import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function IzinModal({ show, onClose, defaultDate = null }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    status: 'Sakit', // default
    keterangan: '',
    tanggal: defaultDate || new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!show) {
      // bersihkan form saat modal ditutup
      reset('keterangan', 'status');
      setData('status', 'Sakit');
      setData('keterangan', '');
      setData('tanggal', defaultDate || new Date().toISOString().slice(0, 10));
    }
  }, [show]);

  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    post(route('guru.absensi-harian.izin'), {
      data,
      preserveScroll: true,
      onSuccess: () => {
        // tutup modal otomatis setelah sukses
        onClose && onClose();
      },
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose && onClose()}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold mb-2">Ajukan Sakit / Izin</h3>
          <p className="text-sm text-gray-500 mb-4">
            Isi data di bawah dan klik <strong>Kirim</strong>. Admin akan diberi tahu.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm">
              Tanggal
              <input
                type="date"
                value={data.tanggal}
                onChange={(e) => setData('tanggal', e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                required
              />
              {errors.tanggal && <div className="text-xs text-red-600 mt-1">{errors.tanggal}</div>}
            </label>

            <label className="text-sm">
              Status
              <select
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                required
              >
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
              </select>
              {errors.status && <div className="text-xs text-red-600 mt-1">{errors.status}</div>}
            </label>

            <label className="text-sm">
              Keterangan (wajib)
              <textarea
                value={data.keterangan}
                onChange={(e) => setData('keterangan', e.target.value)}
                rows="4"
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Contoh: Surat dokter / alasan singkat..."
                required
              />
              {errors.keterangan && <div className="text-xs text-red-600 mt-1">{errors.keterangan}</div>}
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700"
            >
              Batal
            </button>

            <PrimaryButton type="submit" disabled={processing}>
              {processing ? 'Mengirim...' : 'Kirim Pengajuan'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
