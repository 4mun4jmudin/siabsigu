import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import {
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  NoSymbolIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

/**
 * Perbaikan utama:
 * - GANTI useForm().post({ data }) -> router.post(payloadLangsung)
 * - Tambah state `submitting` (mengganti `processing`)
 * - Ambil lokasi TEPAT sebelum submit (getPrecisePosition dengan watchPosition)
 * - Validasi akurasi & geofence dengan pesan error spesifik
 */

// helpers
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  try {
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const d = new Date(`1970-01-01T${timeStr}`);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeStr;
  }
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
      <div className="font-mono text-4xl sm:text-5xl font-extrabold text-gray-900 leading-none tracking-tight select-none">{timeString}</div>
      <div className="mt-1 text-xs text-gray-500">{dateString}</div>
    </div>
  );
};

const Toast = ({ show, type = 'success', message, onClose }) => {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose(), 3600);
    return () => clearTimeout(t);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed z-50 left-1/2 -translate-x-1/2 bottom-24 sm:top-6 sm:bottom-auto">
      <div className={`px-4 py-3 rounded-xl shadow-lg text-white font-medium max-w-xs w-full ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`} role="status" aria-live="polite">
        {message}
      </div>
    </div>
  );
};

// ---------------------- getPrecisePosition: cancelable watcher ----------------------
function getPrecisePosition({ desiredAccuracy = 30, timeout = 30000 } = {}) {
  let watchId = null;
  let timer = null;
  let best = null;
  let resolved = false;

  let resolveFn, rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;

    if (!navigator.geolocation) return reject(new Error('Geolocation tidak didukung'));

    const options = { enableHighAccuracy: true, maximumAge: 0 };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= desiredAccuracy) {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          if (timer) clearTimeout(timer);
          resolved = true;
          resolve(pos);
        }
      },
      (err) => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        if (timer) clearTimeout(timer);
        resolved = true;
        reject(err);
      },
      options
    );

    timer = setTimeout(() => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (best) {
        resolved = true;
        resolve(best);
      } else {
        resolved = true;
        reject(new Error('Timeout mendapatkan lokasi'));
      }
    }, timeout);
  });

  return {
    promise,
    stop: () => {
      try { if (watchId !== null) navigator.geolocation.clearWatch(watchId); } catch {}
      if (!resolved && rejectFn) rejectFn(new Error('Dibatalkan'));
      if (timer) clearTimeout(timer);
    },
  };
}

// MapEmbed (dinamis) — centering 'school' atau 'student', dengan lingkaran akurasi
function MapEmbed({ schoolLat, schoolLng, studentCoords, radius = 200, small = true, centerMode = 'school' }) {
  const [components, setComponents] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    let mounted = true;
    (async () => {
      try {
        const mod = await import('react-leaflet');
        const L = await import('leaflet');
        try {
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        } catch {}
        if (!mounted) return;
        setComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          Marker: mod.Marker,
          Popup: mod.Popup,
          Circle: mod.Circle,
        });
      } catch {
        setComponents(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const schoolCenter = (schoolLat && schoolLng) ? [parseFloat(schoolLat), parseFloat(schoolLng)] : null;
  const studentCenter = (studentCoords && typeof studentCoords.latitude === 'number') ? [studentCoords.latitude, studentCoords.longitude] : null;
  const center = centerMode === 'student' && studentCenter ? studentCenter : (schoolCenter || studentCenter);
  const iframeSrc = center ? `https://www.google.com/maps?q=${center[0]},${center[1]}&z=16&output=embed` : null;

  if (components && center) {
    const { MapContainer, TileLayer, Marker, Popup, Circle } = components;
    return (
      <div className={`${small ? 'h-40' : 'h-96'} rounded-lg overflow-hidden border`}>
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {schoolCenter && (
            <>
              <Marker position={schoolCenter}><Popup>Titik Sekolah<br />{schoolCenter[0]}, {schoolCenter[1]}</Popup></Marker>
              <Circle center={schoolCenter} radius={parseInt(radius || 200, 10)} pathOptions={{ color: '#7c3aed', fillOpacity: 0.08 }} />
            </>
          )}

          {studentCenter && (
            <>
              <Marker position={studentCenter}>
                <Popup>
                  Lokasi Anda<br />{studentCenter[0].toFixed(6)}, {studentCenter[1].toFixed(6)}<br />
                  Akurasi: {studentCoords?.accuracy ? `${studentCoords.accuracy} m` : '-'}<br />
                  {studentCoords?.timestamp ? new Date(studentCoords.timestamp).toLocaleTimeString() : ''}
                </Popup>
              </Marker>
              {typeof studentCoords?.accuracy !== 'undefined' && (
                <Circle center={studentCenter} radius={Math.max(10, studentCoords.accuracy)} pathOptions={{ color: '#0ea5a4', fillOpacity: 0.08 }} />
              )}
            </>
          )}
        </MapContainer>
      </div>
    );
  }

  if (iframeSrc) {
    return (
      <div className={`${small ? 'h-40' : 'h-64'} rounded-lg overflow-hidden border`}>
        <iframe title="Peta" src={iframeSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
      </div>
    );
  }

  return <div className={`${small ? 'h-40' : 'h-64'} flex items-center justify-center text-xs text-gray-400 border rounded-lg`}>Peta tidak tersedia</div>;
}

export default function SiswaDashboard({ siswa = {}, absensiHariIni = null, riwayatAbsensi = [], batasWaktuAbsen = null, pengaturan = null }) {
  const { flash } = usePage().props;

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null);
  const [distanceToSchool, setDistanceToSchool] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenterMode, setMapCenterMode] = useState('school');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false); // pengganti processing
  const locateRequestRef = useRef(null);

  useEffect(() => {
    if (flash?.success) setToast({ show: true, message: flash.success, type: 'success' });
    if (flash?.error) setToast({ show: true, message: flash.error, type: 'error' });
  }, [flash]);

  useEffect(() => {
    if (absensiHariIni) { setCoords(null); setDistanceToSchool(null); }
  }, [absensiHariIni]);

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

  const handleGeolocationError = (err) => {
    if (err?.code === 1) setLocationError('Izin lokasi ditolak. Aktifkan izin lokasi di browser.');
    else if (err?.code === 2) setLocationError('Posisi tidak dapat ditemukan. Periksa GPS/Internet.');
    else if (err?.code === 3) setLocationError('Timeout mendapatkan lokasi. Coba lagi.');
    else setLocationError('Gagal mendapatkan lokasi. Pastikan GPS/Internet aktif.');
    setToast({ show: true, message: locationError || 'Gagal mendapatkan lokasi', type: 'error' });
  };

  // ---------------------- submit absen ----------------------
  const handleAbsen = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLocationError('');
    setToast({ show: false, message: '', type: 'success' });

    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung geolokasi.');
      setToast({ show: true, message: 'Browser tidak mendukung geolokasi', type: 'error' });
      return;
    }

    setLocating(true);
    setToast({ show: true, message: 'Mencari lokasi (akurasi tinggi)...', type: 'success' });

    const req = getPrecisePosition({ desiredAccuracy: 30, timeout: 30000 });
    locateRequestRef.current = req;

    try {
      const position = await req.promise;
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy || 0);
      const ts = position.timestamp || Date.now();

      setCoords({ latitude: lat, longitude: lng, accuracy, timestamp: ts });
      setMapCenterMode('student');

      // validasi geofence (jika titik sekolah ada)
      if (pengaturan?.lokasi_sekolah_latitude && pengaturan?.lokasi_sekolah_longitude) {
        const schoolLat = parseFloat(pengaturan.lokasi_sekolah_latitude);
        const schoolLng = parseFloat(pengaturan.lokasi_sekolah_longitude);
        const dist = Math.round(getDistanceMeters(schoolLat, schoolLng, lat, lng));
        setDistanceToSchool(dist);

        const allowed = parseInt(pengaturan.radius_absen_meters || 200, 10);
        if (dist > allowed) {
          setToast({ show: true, message: `Anda ${dist} m dari titik sekolah (batas ${allowed} m). Absen ditolak.`, type: 'error' });
          return;
        }
      }

      // (opsional) tolak akurasi buruk
      if (accuracy > 100) {
        setToast({ show: true, message: `Akurasi lokasi terlalu rendah (${accuracy} m). Gunakan HP/GPS.`, type: 'error' });
        return;
      }

      // kirim payload DENGAN BENAR (router.post, payload langsung)
      const payload = {
        latitude: String(lat),
        longitude: String(lng),
        accuracy: String(accuracy),
        timestamp: new Date(ts).toISOString(),
      };

      setSubmitting(true);
      router.post(route('siswa.absensi.store'), payload, {
        preserveScroll: true,
        onStart: () => setToast({ show: true, message: 'Mengirim lokasi & menyimpan absensi...', type: 'success' }),
        onSuccess: () => setToast({ show: true, message: 'Absensi berhasil terekam ✔', type: 'success' }),
        onError: (errors) => {
          const msg = errors?.latitude || errors?.longitude || errors?.message || 'Gagal absen, periksa konsol.';
          setToast({ show: true, message: msg, type: 'error' });
        },
        onFinish: () => setSubmitting(false),
      });

    } catch (err) {
      console.error('Geolocation failed:', err);
      const errMsg = err?.message || 'Gagal mendapatkan lokasi. Coba lagi atau periksa pengaturan lokasi.';
      setLocationError(errMsg);
      setToast({ show: true, message: errMsg, type: 'error' });
    } finally {
      setLocating(false);
      locateRequestRef.current = null;
    }
  };

  const cancelLocating = () => {
    if (locateRequestRef.current?.stop) {
      locateRequestRef.current.stop();
      locateRequestRef.current = null;
      setLocating(false);
      setToast({ show: true, message: 'Pencarian lokasi dibatalkan', type: 'error' });
    }
  };

  return (
    <SiswaLayout header="Absensi" className="bg-gray-50">
      <Head title="Absensi Siswa" />

      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast(s => ({ ...s, show: false }))} />

      <main className="max-w-lg mx-auto px-4 pb-32">
        {/* Profile */}
        <section className="mt-6">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="relative">
                <img
                  src={siswa?.foto_profil ? `/storage/${siswa.foto_profil}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa?.nama_lengkap || 'Siswa')}&background=7c3aed&color=fff`}
                  alt={siswa?.nama_lengkap}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <span className="absolute -right-0 -bottom-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden></span>
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{siswa?.nama_panggilan || siswa?.nama_lengkap}</div>
                <div className="text-xs text-gray-500 mt-0.5">{siswa?.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : '-'}</div>
                <div className="text-xs text-gray-400 mt-1">NIS: <span className="font-medium text-gray-700">{siswa?.nis || '-'}</span></div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => { setMapCenterMode('school'); setMapOpen(true); }} className="flex items-center gap-2 text-xs px-3 py-2 bg-sky-50 border border-sky-100 rounded-lg" aria-label="Lihat peta sekolah">
                  <MapPinIcon className="w-4 h-4 text-sky-600" />
                  <span className="text-sky-700 font-medium">Peta Sekolah</span>
                </button>
                <button onClick={() => { if (coords) { setMapCenterMode('student'); setMapOpen(true); } else { setToast({ show: true, message: 'Lokasi Anda belum tersedia. Tekan tombol Absen untuk mengizinkan lokasi.', type: 'error' }); } }} className="flex items-center gap-2 text-xs px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">Tampilkan Lokasi Saya</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-t">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div><div className="text-sm font-bold text-gray-900">{summary.hadir}</div><div className="text-gray-400">Hadir</div></div>
                <div><div className="text-sm font-bold text-gray-900">{summary.sakit}</div><div className="text-gray-400">Sakit</div></div>
                <div><div className="text-sm font-bold text-gray-900">{summary.izin}</div><div className="text-gray-400">Izin</div></div>
                <div><div className="text-sm font-bold text-gray-900">{summary.alfa}</div><div className="text-gray-400">Alfa</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* Absensi + map preview */}
        <section className="mt-5">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Absensi Hari Ini</h3>
                <p className="text-xs text-gray-500">{tanggalHariIni}</p>
              </div>
              <div className="text-xs text-gray-400">Status</div>
            </div>

            <div className="mt-4"><DigitalClock /></div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {(pengaturan?.lokasi_sekolah_latitude && pengaturan?.lokasi_sekolah_longitude) || coords ? (
                <div>
                  <label className="text-xs font-medium text-gray-600">Preview Peta (Preferensi: {mapCenterMode})</label>
                  <div className="mt-2">
                    <Suspense fallback={<div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">Memuat peta...</div>}>
                      <MapEmbed
                        schoolLat={pengaturan?.lokasi_sekolah_latitude}
                        schoolLng={pengaturan?.lokasi_sekolah_longitude}
                        studentCoords={coords}
                        radius={parseInt(pengaturan?.radius_absen_meters || 200, 10)}
                        small
                        centerMode={mapCenterMode}
                      />
                    </Suspense>
                  </div>
                </div>
              ) : null}

              <div>
                {absensiHariIni ? (
                  <div className="rounded-lg bg-emerald-50 border-l-4 border-emerald-400 p-3 flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-emerald-800">Anda Sudah Absen</div>
                      <div className="text-xs text-emerald-700 mt-1">
                        Jam masuk: <strong>{formatTime(absensiHariIni.jam_masuk)}</strong>
                        {absensiHariIni.jam_pulang && <span> • Jam pulang: <strong>{formatTime(absensiHariIni.jam_pulang)}</strong></span>}
                      </div>
                    </div>
                  </div>
                ) : isTimeUp ? (
                  <div className="rounded-lg bg-rose-50 border-l-4 border-rose-400 p-3 text-center">
                    <NoSymbolIcon className="w-6 h-6 text-rose-600 mx-auto" />
                    <div className="font-semibold text-rose-800 mt-2">Waktu Absensi Berakhir</div>
                    <div className="text-xs text-rose-700 mt-1">Silakan lapor ke guru piket untuk absensi manual.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <form onSubmit={handleAbsen}>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting || locating}
                          aria-label="Absen Masuk Sekarang"
                          className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-200 transform transition ${submitting || locating ? 'opacity-60 cursor-wait' : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:scale-[1.01]'}`}
                        >
                          <div className="flex items-center justify-center gap-3">
                            <ClockIcon className="w-5 h-5" />
                            <span>{submitting || locating ? 'Memproses...' : 'Absen Masuk Sekarang'}</span>
                          </div>
                        </button>

                        {locating && (
                          <button type="button" onClick={cancelLocating} className="px-3 py-3 rounded-xl bg-white border text-sm shadow-sm">
                            Batal
                          </button>
                        )}
                      </div>
                    </form>

                    {coords && (
                      <div className="p-3 bg-sky-50 rounded-lg text-xs text-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="truncate">Koordinat: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</div>
                          <button onClick={() => { setCoords(null); setDistanceToSchool(null); setMapCenterMode('school'); }} aria-label="Reset koordinat" className="ml-2 p-1 rounded-md bg-white shadow-sm">
                            <XMarkIcon className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Akurasi: <strong>{coords.accuracy ? `${coords.accuracy} m` : '-'}</strong> • Waktu: {coords.timestamp ? new Date(coords.timestamp).toLocaleTimeString() : '-'}</div>
                        {distanceToSchool !== null && (
                          <div className="mt-3 text-xs text-gray-500">Jarak ke sekolah: <strong>{distanceToSchool} m</strong></div>
                        )}
                        <div className="mt-2">
                          <button onClick={() => { setMapCenterMode('student'); setMapOpen(true); }} className="text-xs px-3 py-2 rounded-md bg-white border border-gray-100 shadow-sm">Tampilkan Lokasi Saya</button>
                        </div>
                      </div>
                    )}

                    {locationError && <div className="text-xs text-rose-600 text-center">{locationError}</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-2 rounded-lg flex items-start gap-3 text-xs">
                <InformationCircleIcon className="w-5 h-5" />
                <div>Pastikan lokasi & koneksi Anda aktif. Jika perangkat meminta izin lokasi, pilih <strong>Izinkan</strong>.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Riwayat */}
        <section className="mt-5">
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Rekap & Riwayat</h4>
              <div className="text-xs text-gray-500">5 Terakhir</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-sky-50 text-center"><div className="text-lg font-bold">{summary.hadir}</div><div className="text-xs text-gray-500">Hadir</div></div>
              <div className="p-3 rounded-lg bg-yellow-50 text-center"><div className="text-lg font-bold">{summary.sakit}</div><div className="text-xs text-gray-500">Sakit</div></div>
              <div className="p-3 rounded-lg bg-blue-50 text-center"><div className="text-lg font-bold">{summary.izin}</div><div className="text-xs text-gray-500">Izin</div></div>
              <div className="p-3 rounded-lg bg-rose-50 text-center"><div className="text-lg font-bold">{summary.alfa}</div><div className="text-xs text-gray-500">Alfa</div></div>
            </div>

            <div className="mt-4 border-t pt-3">
              <ul className="divide-y divide-gray-100">
                {(riwayatAbsensi || []).slice(0, 5).map(item => (
                  <li key={item.id_absensi} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                      <div className="text-xs text-gray-500">{formatTime(item.jam_masuk)}</div>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      item.status_kehadiran === 'Hadir' ? 'bg-emerald-100 text-emerald-700'
                      : item.status_kehadiran === 'Sakit' ? 'bg-yellow-100 text-yellow-700'
                      : item.status_kehadiran === 'Izin' ? 'bg-sky-100 text-sky-700'
                      : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.status_kehadiran}
                    </div>
                  </li>
                ))}
                {(!riwayatAbsensi || riwayatAbsensi.length === 0) && <li className="py-3 text-sm text-gray-500">Belum ada riwayat absensi.</li>}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed bottom CTA (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-gradient-to-r from-white/60 to-white/60 backdrop-blur-md border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1">
            {absensiHariIni ? (
              <div className="text-xs text-gray-700">Terima kasih — Anda sudah absen ✔</div>
            ) : isTimeUp ? (
              <div className="text-xs text-rose-600">Waktu absen telah selesai</div>
            ) : (
              <div className="text-xs text-gray-500">Tekan untuk melakukan absensi masuk</div>
            )}
          </div>
          <button
            onClick={handleAbsen}
            disabled={submitting || !!absensiHariIni || isTimeUp || locating}
            aria-label="Absen cepat"
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-white font-semibold shadow-lg focus:outline-none ${
              submitting || locating ? 'opacity-60 cursor-wait' : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:scale-[1.02] transition-transform'
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            <span className="text-sm">{submitting || locating ? 'Memproses...' : (absensiHariIni ? 'Sudah Absen' : 'Absen Sekarang')}</span>
          </button>
        </div>
      </div>

      {/* Modal Peta */}
      {mapOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <div className="w-full sm:w-3/4 lg:w-1/2 bg-white rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-sky-600" />
                <div className="text-sm font-semibold">Peta</div>
                <div className="text-xs text-gray-400 ml-2">({mapCenterMode === 'student' ? 'Lokasi Saya' : 'Sekolah'})</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setMapCenterMode('school'); }} className={`text-xs px-2 py-1 rounded ${mapCenterMode === 'school' ? 'bg-sky-50 border' : 'bg-white'}`}>Sekolah</button>
                <button onClick={() => { if (coords) setMapCenterMode('student'); else setToast({ show: true, message: 'Lokasi belum tersedia. Tekan absen untuk kirim lokasi dulu.', type: 'error' }); }} className={`text-xs px-2 py-1 rounded ${mapCenterMode === 'student' ? 'bg-sky-50 border' : 'bg-white'}`}>Lokasi Saya</button>
                <button onClick={() => setMapOpen(false)} className="p-2 rounded-md bg-gray-100"><XMarkIcon className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-4">
              <Suspense fallback={<div className="h-64 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">Memuat peta...</div>}>
                <MapEmbed
                  schoolLat={pengaturan?.lokasi_sekolah_latitude}
                  schoolLng={pengaturan?.lokasi_sekolah_longitude}
                  studentCoords={coords}
                  radius={parseInt(pengaturan?.radius_absen_meters || 200, 10)}
                  small={false}
                  centerMode={mapCenterMode}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </SiswaLayout>
  );
}
