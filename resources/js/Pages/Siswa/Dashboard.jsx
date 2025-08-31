import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import {
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/solid';

/**
 * Siswa Dashboard & Absensi (Frontend lengkap)
 *
 * Props expected from server:
 * - siswa
 * - absensiHariIni
 * - riwayatAbsensi
 * - batasWaktuAbsen (string "HH:mm:ss" or "HH:mm")
 * - pengaturan (optional) { lokasi_sekolah_latitude, lokasi_sekolah_longitude, radius_absen_meters }
 *
 * Notes:
 * - Must use route('siswa.absensi.store') on server side (Inertia route helper)
 * - Backend expects fields: latitude (string), longitude (string)
 */

// ---------- Small UI helpers ----------
const Toast = ({ show, type = 'success', message, onClose }) => {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose(), 3800);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-6 top-6 z-50 max-w-sm w-full rounded-lg px-4 py-3 shadow-lg text-white ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {type === 'success' ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v3m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button onClick={onClose} aria-label="Close toast" className="opacity-80 hover:opacity-100">✕</button>
      </div>
    </div>
  );
};

const DigitalClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-5xl sm:text-6xl font-extrabold text-gray-900 leading-none tracking-tight select-none">{timeString}</div>
      <div className="mt-2 text-sm text-gray-600">{dateString}</div>
    </div>
  );
};

const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // metres
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  try {
    // Accepts "HH:mm:ss" or "HH:mm" or "YYYY-MM-DDTHH:mm:ss"
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    const d = new Date(`1970-01-01T${timeStr}`);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeStr;
  }
};

// ---------- Main component ----------
export default function SiswaDashboard({ siswa = {}, absensiHariIni = null, riwayatAbsensi = [], batasWaktuAbsen = null, pengaturan = null }) {
  const { post, processing } = useForm(); // useForm just for post helper
  const { flash } = usePage().props;

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [distanceToSchool, setDistanceToSchool] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // check batas waktu setiap menit
  useEffect(() => {
    const checkTime = () => {
      if (!batasWaktuAbsen) return setIsTimeUp(false);
      const now = new Date();
      const [h, m] = batasWaktuAbsen.split(':').map(Number);
      const deadline = new Date();
      deadline.setHours(h, m || 0, 0, 0);
      setIsTimeUp(now > deadline);
    };
    checkTime();
    const id = setInterval(checkTime, 60000);
    return () => clearInterval(id);
  }, [batasWaktuAbsen]);

  useEffect(() => {
    if (flash?.success) setToast({ show: true, message: flash.success, type: 'success' });
    if (flash?.error) setToast({ show: true, message: flash.error, type: 'error' });
  }, [flash]);

  useEffect(() => {
    // reset coords when absensiHariIni changes (after successful absen, backend may reload page)
    if (absensiHariIni) {
      setCoords(null);
      setDistanceToSchool(null);
    }
  }, [absensiHariIni]);

  const handleGeolocationError = (err) => {
    console.error('Geolocation error', err);
    if (err.code === 1) setLocationError('Izin lokasi ditolak. Aktifkan izin lokasi di browser.');
    else if (err.code === 2) setLocationError('Posisi tidak dapat ditemukan. Periksa GPS/Internet.');
    else if (err.code === 3) setLocationError('Timeout mendapatkan lokasi. Coba lagi.');
    else setLocationError('Gagal mendapatkan lokasi. Pastikan GPS/Internet aktif.');
    setToast({ show: true, message: locationError || 'Gagal mendapatkan lokasi', type: 'error' });
  };

  // Primary handler: get location then post to server
  const handleAbsen = (e) => {
    e.preventDefault();
    setLocationError('');
    setToast({ show: false, message: '', type: 'success' });

    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung geolokasi.');
      setToast({ show: true, message: 'Browser tidak mendukung geolokasi', type: 'error' });
      return;
    }

    const geoOptions = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

    // show a quick toast that we are trying to get location
    setToast({ show: true, message: 'Mencari lokasi... Mohon tunggu.', type: 'success' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('GEO OK', { lat, lng, accuracy: position.coords.accuracy });

        setCoords({ latitude: lat, longitude: lng });

        // if pengaturan contains school coords, compute distance
        if (pengaturan && pengaturan.lokasi_sekolah_latitude && pengaturan.lokasi_sekolah_longitude) {
          const schoolLat = parseFloat(pengaturan.lokasi_sekolah_latitude);
          const schoolLng = parseFloat(pengaturan.lokasi_sekolah_longitude);
          const dist = Math.round(getDistanceMeters(schoolLat, schoolLng, lat, lng));
          setDistanceToSchool(dist);

          // if outside allowed radius, reject and inform user
          const allowed = parseInt(pengaturan.radius_absen_meters || 200, 10);
          if (dist > allowed) {
            setToast({ show: true, message: `Anda berada ${dist} m dari titik sekolah (batas ${allowed} m). Absen ditolak.`, type: 'error' });
            return;
          }
        }

        // Build payload and send
        const payload = {
          latitude: String(lat),
          longitude: String(lng),
        };

        post(route('siswa.absensi.store'), {
          data: payload,
          preserveScroll: true,
          onStart: () => setToast({ show: true, message: 'Mengirim lokasi & menyimpan absensi...', type: 'success' }),
          onSuccess: () => {
            setToast({ show: true, message: 'Absensi berhasil terekam ✔', type: 'success' });
            // backend will usually redirect or re-render Inertia page with new absensiHariIni
          },
          onError: (errors) => {
            console.error('SERVER ERR', errors);
            const msg = errors.latitude || errors.longitude || (errors.message ? errors.message : 'Gagal absen, periksa konsol.');
            setToast({ show: true, message: msg, type: 'error' });
          },
        });
      },
      (error) => {
        handleGeolocationError(error);
      },
      geoOptions
    );
  };

  // small summary from riwayatAbsensi
  const summary = useMemo(() => {
    const last30 = (riwayatAbsensi || []).slice(0, 30);
    return {
      hadir: last30.filter(r => r.status_kehadiran === 'Hadir').length,
      sakit: last30.filter(r => r.status_kehadiran === 'Sakit').length,
      izin: last30.filter(r => r.status_kehadiran === 'Izin').length,
      alfa: last30.filter(r => r.status_kehadiran === 'Alfa').length,
      total: last30.length,
    };
  }, [riwayatAbsensi]);

  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SiswaLayout header="Halaman Absensi">
      <Head title="Absensi Siswa" />
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast(s => ({ ...s, show: false }))} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <img
              src={siswa?.foto_profil ? `/storage/${siswa.foto_profil}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa?.nama_lengkap || 'Siswa')}&background=7c3aed&color=fff`}
              alt={siswa?.nama_lengkap}
              className="w-28 h-28 rounded-full object-cover shadow-lg mx-auto -mt-16 border-4 border-white"
            />
            <div className="mt-4">
              <h2 className="text-xl font-bold text-gray-900">{siswa?.nama_panggilan || siswa?.nama_lengkap}</h2>
              <p className="text-sm text-gray-500 mt-1">{siswa?.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : '-'}</p>
              <p className="text-xs text-gray-400 mt-1">NIS: <span className="font-medium text-gray-700">{siswa?.nis || '-'}</span></p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Hadir (30h)</div>
                <div className="text-lg font-bold">{summary.hadir}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Sakit</div>
                <div className="text-lg font-bold">{summary.sakit}</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Izin</div>
                <div className="text-lg font-bold">{summary.izin}</div>
              </div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Alfa</div>
                <div className="text-lg font-bold">{summary.alfa}</div>
              </div>
            </div>
          </div>

          {/* Main action */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900">Absensi Hari Ini</h3>
              <p className="text-sm text-gray-500 mt-1">{tanggalHariIni}</p>
            </div>

            <div className="mt-6 w-full flex-1 flex flex-col items-center justify-center">
              <DigitalClock />

              <div className="mt-6 w-full max-w-md">
                {absensiHariIni ? (
                  <div className="rounded-xl bg-green-50 border-l-4 border-green-500 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-8 w-8 text-green-600 flex-none" />
                      <div>
                        <div className="font-semibold text-green-800">Anda Sudah Absen</div>
                        <div className="text-sm text-green-700 mt-1">
                          Jam masuk: <strong>{formatTime(absensiHariIni.jam_masuk)}</strong>
                          {absensiHariIni.jam_pulang && <span> • Jam pulang: <strong>{formatTime(absensiHariIni.jam_pulang)}</strong></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isTimeUp ? (
                  <div className="rounded-xl bg-red-50 border-l-4 border-red-500 p-4 shadow-sm text-center">
                    <div className="flex flex-col items-center gap-3">
                      <NoSymbolIcon className="h-8 w-8 text-red-600" />
                      <div>
                        <div className="font-semibold text-red-800">Waktu Absensi Berakhir</div>
                        <div className="text-sm text-red-700 mt-1">Silakan lapor ke guru piket untuk absensi manual.</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleAbsen}>
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-[1.02] transform transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-sky-200"
                      >
                        <ClockIcon className="h-6 w-6" />
                        <span>{processing ? 'Memproses...' : 'Absen Masuk Sekarang'}</span>
                      </button>
                    </form>

                    {/* show current coordinates & distance if available */}
                    {coords && (
                      <div className="mt-4 text-sm text-gray-600 text-center">
                        <div>Koordinat: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</div>
                        {distanceToSchool !== null && (
                          <div className="mt-1">
                            Jarak ke sekolah: <strong>{distanceToSchool} m</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {locationError && <p className="mt-3 text-xs text-red-600 text-center">{locationError}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 w-full">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 mt-0.5" />
                <div className="text-sm">
                  Pastikan lokasi & koneksi Anda aktif. Jika perangkat meminta izin lokasi, pilih <strong>Izinkan</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Right column: recent history */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h4 className="text-md font-semibold text-gray-900">Rekap & Riwayat</h4>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg">
                <div className="text-2xl font-bold">{summary.hadir}</div>
                <div className="text-xs text-gray-500">Hadir</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg">
                <div className="text-2xl font-bold">{summary.sakit}</div>
                <div className="text-xs text-gray-500">Sakit</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <div className="text-2xl font-bold">{summary.izin}</div>
                <div className="text-xs text-gray-500">Izin</div>
              </div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                <div className="text-2xl font-bold">{summary.alfa}</div>
                <div className="text-xs text-gray-500">Alfa</div>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <h5 className="text-sm font-semibold text-gray-900">5 Rekaman Terakhir</h5>
              <ul className="mt-3 divide-y divide-gray-100">
                {(riwayatAbsensi || []).slice(0, 5).map(item => (
                  <li key={item.id_absensi} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                      <div className="text-xs text-gray-500">{formatTime(item.jam_masuk)}</div>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      item.status_kehadiran === 'Hadir' ? 'bg-green-100 text-green-700' :
                      item.status_kehadiran === 'Sakit' ? 'bg-yellow-100 text-yellow-700' :
                      item.status_kehadiran === 'Izin' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status_kehadiran}
                    </div>
                  </li>
                ))}
                {(!riwayatAbsensi || riwayatAbsensi.length === 0) && <li className="py-3 text-sm text-gray-500">Belum ada riwayat absensi.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SiswaLayout>
  );
}
    