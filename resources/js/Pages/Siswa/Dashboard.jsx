// resources/js/Pages/Siswa/Dashboard.jsx
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

// ===================== Helpers =====================
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  try {
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
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
  const timeString = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-4xl sm:text-5xl font-extrabold text-gray-900 leading-none tracking-tight select-none">
        {timeString}
      </div>
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
      <div
        className={`px-4 py-3 rounded-xl shadow-lg text-white font-medium max-w-xs w-full ${
          type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
};

// ===================== Geolocation helper (precise) =====================
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
      try {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      } catch {}
      if (!resolved && rejectFn) rejectFn(new Error('Dibatalkan'));
      if (timer) clearTimeout(timer);
    },
  };
}

// ===================== MapEmbed: sekolah + siswa + radius =====================
function MapEmbed({
  schoolLat,
  schoolLng,
  studentCoords,
  radius = 200,
  small = true,
  centerMode = 'school',
  invalidateKey,
  outsideRadius = false,
}) {
  const [components, setComponents] = useState(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        try {
          mapRef.current.invalidateSize();
        } catch {}
      }, 150);
    }
  }, [invalidateKey, centerMode]);

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
            iconRetinaUrl:
              'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        } catch {}

        if (!mounted) return;

        leafletRef.current = L;

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

    return () => {
      mounted = false;
    };
  }, []);

  const schoolCenter =
    schoolLat && schoolLng ? [parseFloat(schoolLat), parseFloat(schoolLng)] : null;

  const studentCenter =
    studentCoords && typeof studentCoords.latitude === 'number'
      ? [studentCoords.latitude, studentCoords.longitude]
      : null;

  const center =
    centerMode === 'student' && studentCenter
      ? studentCenter
      : schoolCenter || studentCenter;

  const iframeSrc = center
    ? `https://www.google.com/maps?q=${center[0]},${center[1]}&z=16&output=embed`
    : null;

  // auto fit bounds jika ada dua titik (sekolah + siswa)
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;
    if (!schoolCenter || !studentCenter) return;

    try {
      const L = leafletRef.current;
      const bounds = L.latLngBounds([schoolCenter, studentCenter]);
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    } catch {}
  }, [
    schoolCenter && schoolCenter[0],
    schoolCenter && schoolCenter[1],
    studentCenter && studentCenter[0],
    studentCenter && studentCenter[1],
  ]);

  if (components && center) {
    const { MapContainer, TileLayer, Marker, Popup, Circle } = components;

    const mapKey = `${center?.[0] ?? 'x'}-${center?.[1] ?? 'x'}-${
      small ? 's' : 'l'
    }-${centerMode}-${invalidateKey ?? ''}-${outsideRadius ? 'out' : 'in'}`;

    const radiusColor = outsideRadius ? '#dc2626' : '#7c3aed'; // merah kalau di luar

    return (
      <div className={`${small ? 'h-40' : 'h-96'} rounded-lg overflow-hidden border`}>
        <MapContainer
          key={mapKey}
          center={center}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          whenCreated={(m) => {
            mapRef.current = m;
            setTimeout(() => {
              try {
                m.invalidateSize();
              } catch {}
            }, 50);
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Titik Sekolah + Radius Absensi */}
          {schoolCenter && (
            <>
              <Marker position={schoolCenter}>
                <Popup>
                  Titik Sekolah
                  <br />
                  {schoolCenter[0]}, {schoolCenter[1]}
                  <br />
                  Radius absensi: {parseInt(radius || 200, 10)} m
                  <br />
                  Status siswa:{' '}
                  <strong>{outsideRadius ? 'DI LUAR RADIUS' : 'DI DALAM RADIUS'}</strong>
                </Popup>
              </Marker>

              <Circle
                center={schoolCenter}
                radius={parseInt(radius || 200, 10)}
                pathOptions={{
                  color: radiusColor,
                  fillOpacity: 0.08,
                  weight: 2,
                }}
              />
            </>
          )}

          {/* Titik Siswa + Lingkaran Akurasi */}
          {studentCenter && (
            <>
              <Marker position={studentCenter}>
                <Popup>
                  Lokasi Anda
                  <br />
                  {studentCenter[0].toFixed(6)}, {studentCenter[1].toFixed(6)}
                  <br />
                  Akurasi:{' '}
                  {studentCoords?.accuracy ? `${studentCoords.accuracy} m` : '-'}
                  <br />
                  {studentCoords?.timestamp
                    ? new Date(studentCoords.timestamp).toLocaleTimeString()
                    : ''}
                </Popup>
              </Marker>

              {typeof studentCoords?.accuracy !== 'undefined' && (
                <Circle
                  center={studentCenter}
                  radius={Math.max(10, studentCoords.accuracy)}
                  pathOptions={{
                    color: '#0ea5a4',
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />
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
        <iframe
          title="Peta"
          src={iframeSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${small ? 'h-40' : 'h-64'} flex items-center justify-center text-xs text-gray-400 border rounded-lg`}
    >
      Peta tidak tersedia
    </div>
  );
}

// ===================== Main Component =====================
export default function SiswaDashboard({
  siswa = {},
  absensiHariIni = null,
  riwayatAbsensi = [],
  batasWaktuAbsen = null,
  pengaturan = null,
}) {
  const { flash } = usePage().props;

  const currentDate = new Date();
  const initialYear = currentDate.getFullYear();
  const initialMonth = currentDate.getMonth() + 1;

  const [filter, setFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(initialMonth); // 1-12
  const [yearFilter, setYearFilter] = useState(initialYear);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null);
  const [distanceToSchool, setDistanceToSchool] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenterMode, setMapCenterMode] = useState('school');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const locateRequestRef = useRef(null);

  // countdown pulang
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [countdownPulang, setCountdownPulang] = useState('');

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  const filterLabel =
    filter === 'week'
      ? 'Mingguan'
      : filter === 'month'
      ? `Bulanan (${monthNames[monthFilter - 1]} ${yearFilter})`
      : filter === 'year'
      ? `Tahunan (${yearFilter})`
      : 'Semua';

  // ===== Fetch riwayat saat filter / bulan / tahun berubah =====
  useEffect(() => {
    const params = {};

    if (filter !== 'all') {
      params.filter = filter;
    }

    if (filter === 'month') {
      params.month = monthFilter;
      params.year = yearFilter;
    } else if (filter === 'year') {
      params.year = yearFilter;
    }

    router.get(route('siswa.dashboard'), params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }, [filter, monthFilter, yearFilter]);

  // flash message
  useEffect(() => {
    if (flash?.success)
      setToast({ show: true, message: flash.success, type: 'success' });
    if (flash?.error) setToast({ show: true, message: flash.error, type: 'error' });
  }, [flash]);

  // cek batas waktu absen masuk
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

  // ambil lokasi awal (boleh untuk preview map)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const ts = pos.timestamp || Date.now();
        const obj = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy || 0),
          timestamp: ts,
        };
        setCoords(obj);

        if (pengaturan?.lokasi_sekolah_latitude && pengaturan?.lokasi_sekolah_longitude) {
          const schoolLat = parseFloat(pengaturan.lokasi_sekolah_latitude);
          const schoolLng = parseFloat(pengaturan.lokasi_sekolah_longitude);
          const dist = Math.round(
            getDistanceMeters(schoolLat, schoolLng, latitude, longitude)
          );
          setDistanceToSchool(dist);
        }
      },
      (err) => {
        console.warn('Initial geolocation failed:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hitung mundur absen pulang
  useEffect(() => {
    if (!absensiHariIni || absensiHariIni.jam_pulang) {
      setCanCheckOut(false);
      setCountdownPulang('');
      return;
    }

    const jamPulangStr = pengaturan?.jam_pulang_siswa || '15:00:00';

    const updateCountdown = () => {
      const now = new Date();
      const [h, m, s] = jamPulangStr.split(':').map(Number);
      const target = new Date();
      target.setHours(h || 0, m || 0, s || 0, 0);

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setCanCheckOut(true);
        setCountdownPulang('00:00:00');
        return;
      }

      setCanCheckOut(false);
      const totalSec = Math.floor(diff / 1000);
      const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      setCountdownPulang(`${hh}:${mm}:${ss}`);
    };

    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [absensiHariIni, pengaturan]);

  const summary = useMemo(() => {
    const lastData = riwayatAbsensi || [];
    return {
      hadir: lastData.filter((r) => r.status_kehadiran === 'Hadir').length,
      sakit: lastData.filter((r) => r.status_kehadiran === 'Sakit').length,
      izin: lastData.filter((r) => r.status_kehadiran === 'Izin').length,
      alfa: lastData.filter((r) => r.status_kehadiran === 'Alfa').length,
      total: lastData.length,
    };
  }, [riwayatAbsensi]);

  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleGeolocationError = (err) => {
    let msg;
    if (err?.code === 1)
      msg = 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.';
    else if (err?.code === 2)
      msg = 'Posisi tidak dapat ditemukan. Periksa GPS/Internet.';
    else if (err?.code === 3)
      msg = 'Timeout mendapatkan lokasi. Coba lagi.';
    else msg = 'Gagal mendapatkan lokasi. Pastikan GPS/Internet aktif.';

    setLocationError(msg);
    setToast({ show: true, message: msg, type: 'error' });
  };

  // ===================== handleAbsen (Masuk / Pulang) =====================
  const handleAbsen = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLocationError('');
    setToast({ show: false, message: '', type: 'success' });

    if (!navigator.geolocation) {
      const msg = 'Browser Anda tidak mendukung geolokasi.';
      setLocationError(msg);
      setToast({ show: true, message: msg, type: 'error' });
      return;
    }

    const mode =
      absensiHariIni && !absensiHariIni.jam_pulang ? 'pulang' : 'masuk';

    if (mode === 'pulang' && !canCheckOut) {
      setToast({
        show: true,
        message: 'Belum waktu absensi pulang. Tunggu hitung mundur selesai.',
        type: 'error',
      });
      return;
    }

    setLocating(true);
    setToast({
      show: true,
      message: 'Mencari lokasi (akurasi tinggi)...',
      type: 'success',
    });

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

      if (pengaturan?.lokasi_sekolah_latitude && pengaturan?.lokasi_sekolah_longitude) {
        const schoolLat = parseFloat(pengaturan.lokasi_sekolah_latitude);
        const schoolLng = parseFloat(pengaturan.lokasi_sekolah_longitude);
        const dist = Math.round(getDistanceMeters(schoolLat, schoolLng, lat, lng));
        setDistanceToSchool(dist);

        const allowed = parseInt(pengaturan.radius_absen_meters || 200, 10);
        if (dist > allowed) {
          setToast({
            show: true,
            message: `Anda ${dist} m dari titik sekolah (batas ${allowed} m). Absen ditolak.`,
            type: 'error',
          });
          return;
        }
      }

      if (accuracy > 100) {
        setToast({
          show: true,
          message: `Akurasi lokasi terlalu rendah (${accuracy} m). Gunakan HP/GPS.`,
          type: 'error',
        });
        return;
      }

      const payload = {
        latitude: String(lat),
        longitude: String(lng),
        accuracy: String(accuracy),
        timestamp: new Date(ts).toISOString(),
        mode, // masuk / pulang
      };

      setSubmitting(true);
      router.post(route('siswa.absensi.store'), payload, {
        preserveScroll: true,
        onStart: () =>
          setToast({
            show: true,
            message: `Mengirim lokasi & menyimpan absensi ${mode}...`,
            type: 'success',
          }),
        onSuccess: () =>
          setToast({
            show: true,
            message:
              mode === 'masuk'
                ? 'Absensi masuk berhasil terekam ✔'
                : 'Absensi pulang berhasil terekam ✔',
            type: 'success',
          }),
        onError: (errors) => {
          const msg =
            errors?.latitude ||
            errors?.longitude ||
            errors?.message ||
            'Gagal absen, periksa konsol.';
          setToast({ show: true, message: msg, type: 'error' });
        },
        onFinish: () => setSubmitting(false),
      });
    } catch (err) {
      console.error('Geolocation failed:', err);
      const errMsg =
        err?.message ||
        'Gagal mendapatkan lokasi. Coba lagi atau periksa pengaturan lokasi.';
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
      setToast({
        show: true,
        message: 'Pencarian lokasi dibatalkan',
        type: 'error',
      });
    }
  };

  const radiusMeters = parseInt(pengaturan?.radius_absen_meters || 200, 10);
  const outsideRadius =
    distanceToSchool !== null && radiusMeters && distanceToSchool > radiusMeters;

  return (
    <SiswaLayout header="Absensi" className="bg-gray-50">
      <Head title="Absensi Siswa" />

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, show: false }))}
      />

      <main className="max-w-lg mx-auto px-4 pb-32">
        {/* ===== Filter Riwayat + pilih bulan/tahun ===== */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex justify-end gap-2">
            {['all', 'week', 'month', 'year'].map((opt) => {
              const label =
                opt === 'all'
                  ? 'Semua'
                  : opt === 'week'
                  ? 'Mingguan'
                  : opt === 'month'
                  ? 'Bulanan'
                  : 'Tahunan';
              return (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-3 py-1 rounded text-xs ${
                    filter === opt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Dropdown bulan & tahun saat filter Bulanan / Tahunan */}
          {(filter === 'month' || filter === 'year') && (
            <div className="flex justify-end gap-2 text-xs">
              {filter === 'month' && (
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {/* Range tahun sederhana: currentYear-3 .. currentYear */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const year = initialYear - 3 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* ===== Profile ===== */}
        <section className="mt-4">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="relative">
                <img
                  src={
                    siswa?.foto_profil
                      ? `/storage/${siswa.foto_profil}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          siswa?.nama_lengkap || 'Siswa'
                        )}&background=7c3aed&color=fff`
                  }
                  alt={siswa?.nama_lengkap}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <span
                  className="absolute -right-0 -bottom-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                  aria-hidden
                ></span>
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  {siswa?.nama_panggilan || siswa?.nama_lengkap}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {siswa?.kelas
                    ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}`
                    : '-'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  NIS:{' '}
                  <span className="font-medium text-gray-700">
                    {siswa?.nis || '-'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMapCenterMode('school');
                    setMapOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs px-3 py-2 bg-sky-50 border border-sky-100 rounded-lg"
                  aria-label="Lihat peta sekolah"
                >
                  <MapPinIcon className="w-4 h-4 text-sky-600" />
                  <span className="text-sky-700 font-medium">Peta Sekolah</span>
                </button>
                <button
                  onClick={() => {
                    if (coords) {
                      setMapCenterMode('student');
                      setMapOpen(true);
                    } else if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const { latitude, longitude, accuracy } = pos.coords;
                          const ts = pos.timestamp || Date.now();
                          const data = {
                            latitude,
                            longitude,
                            accuracy: Math.round(accuracy || 0),
                            timestamp: ts,
                          };
                          setCoords(data);
                          setMapCenterMode('student');
                          setMapOpen(true);
                        },
                        (err) => {
                          handleGeolocationError(err);
                        },
                        {
                          enableHighAccuracy: true,
                          maximumAge: 60000,
                          timeout: 10000,
                        }
                      );
                    } else {
                      setToast({
                        show: true,
                        message:
                          'Browser tidak mendukung geolokasi. Tidak dapat menampilkan lokasi.',
                        type: 'error',
                      });
                    }
                  }}
                  className="flex items-center gap-2 text-xs px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm"
                >
                  <span className="text-gray-700 font-medium">
                    Tampilkan Lokasi Saya
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-t">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {summary.hadir}
                  </div>
                  <div className="text-gray-400">Hadir</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {summary.sakit}
                  </div>
                  <div className="text-gray-400">Sakit</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {summary.izin}
                  </div>
                  <div className="text-gray-400">Izin</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {summary.alfa}
                  </div>
                  <div className="text-gray-400">Alfa</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Info koordinat & radius global ===== */}
        <div className="mt-4 p-3 bg-sky-50 rounded-lg text-xs text-gray-700">
          <div>
            Koordinat saya:{' '}
            {coords
              ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
              : '-'}
          </div>
          <div>Radius absen sekolah: {radiusMeters} m</div>
          {distanceToSchool !== null && (
            <div>
              Jarak ke sekolah: {distanceToSchool} m (
              <span className={outsideRadius ? 'text-red-600' : 'text-emerald-600'}>
                {outsideRadius ? 'di luar radius' : 'di dalam radius'}
              </span>
              )
            </div>
          )}
        </div>

        {/* ===== Absensi Hari Ini + Peta mini ===== */}
        <section className="mt-5 bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Absensi Hari Ini
              </h3>
              <p className="text-xs text-gray-500">{tanggalHariIni}</p>
            </div>
            <div className="text-xs text-gray-400">Status</div>
          </div>

          <div className="mt-4">
            <DigitalClock />
          </div>

          {/* Map preview */}
          <div className="mt-4 grid grid-cols-1 gap-3">
            {(pengaturan?.lokasi_sekolah_latitude &&
              pengaturan?.lokasi_sekolah_longitude) ||
            coords ? (
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Preview Peta (Preferensi: {mapCenterMode})
                </label>
                <div className="mt-2">
                  <Suspense
                    fallback={
                      <div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        Memuat peta...
                      </div>
                    }
                  >
                    <MapEmbed
                      schoolLat={pengaturan?.lokasi_sekolah_latitude}
                      schoolLng={pengaturan?.lokasi_sekolah_longitude}
                      studentCoords={coords}
                      radius={radiusMeters}
                      small
                      centerMode={mapCenterMode}
                      outsideRadius={outsideRadius}
                    />
                  </Suspense>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Lingkaran{' '}
                  <span className={outsideRadius ? 'text-red-600' : 'text-violet-600'}>
                    {outsideRadius ? 'merah' : 'ungu'}
                  </span>{' '}
                  menunjukkan batas radius absensi sekolah.
                </p>
              </div>
            ) : null}

            {/* Tombol Masuk / Pulang */}
            <div>
              {absensiHariIni ? (
                !absensiHariIni.jam_pulang ? (
                  // Sudah absen masuk, belum pulang → Absen Pulang
                  <div className="space-y-3">
                    <button
                      onClick={handleAbsen}
                      disabled={submitting || locating || !canCheckOut}
                      className={`w-full px-4 py-3 rounded-xl text-white font-semibold shadow-lg focus:outline-none focus:ring-4 flex items-center justify-center gap-2 ${
                        submitting || locating || !canCheckOut
                          ? 'bg-green-500/60 cursor-not-allowed focus:ring-transparent'
                          : 'bg-green-600 focus:ring-green-200'
                      }`}
                    >
                      <ClockIcon className="w-5 h-5" />
                      <span>
                        {submitting || locating
                          ? 'Memproses...'
                          : 'Absen Pulang'}
                      </span>
                    </button>

                    {!canCheckOut && countdownPulang && (
                      <div className="text-xs text-gray-600 text-center">
                        Hitung mundur absen pulang:{' '}
                        <span className="font-mono font-semibold">
                          {countdownPulang}
                        </span>
                      </div>
                    )}
                    {canCheckOut && (
                      <div className="text-xs text-emerald-600 text-center">
                        Sudah boleh melakukan absensi pulang.
                      </div>
                    )}

                    <div className="rounded-lg bg-emerald-50 border-l-4 border-emerald-400 p-3 flex items-start gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-emerald-800">
                          Anda sudah absen masuk
                        </div>
                        <div className="text-xs text-emerald-700 mt-1">
                          Jam masuk:{' '}
                          <strong>{formatTime(absensiHariIni.jam_masuk)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Sudah masuk & pulang
                  <div className="rounded-lg bg-emerald-50 border-l-4 border-emerald-400 p-3 flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-emerald-800">
                        Anda sudah lengkap absen hari ini
                      </div>
                      <div className="text-xs text-emerald-700 mt-1">
                        Masuk:{' '}
                        <strong>{formatTime(absensiHariIni.jam_masuk)}</strong>
                        {' • '}
                        Pulang:{' '}
                        <strong>{formatTime(absensiHariIni.jam_pulang)}</strong>
                      </div>
                    </div>
                  </div>
                )
              ) : isTimeUp ? (
                <div className="rounded-lg bg-rose-50 border-l-4 border-rose-400 p-3 text-center">
                  <NoSymbolIcon className="w-6 h-6 text-rose-600 mx-auto" />
                  <div className="font-semibold text-rose-800 mt-2">
                    Waktu Absensi Berakhir
                  </div>
                  <div className="text-xs text-rose-700 mt-1">
                    Silakan lapor ke guru piket untuk absensi manual.
                  </div>
                </div>
              ) : (
                // Belum ada absensi → Absen Masuk
                <div className="space-y-3">
                  <button
                    onClick={handleAbsen}
                    disabled={submitting || locating}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <ClockIcon className="w-5 h-5" />
                    <span>
                      {submitting || locating ? 'Memproses...' : 'Absen Masuk'}
                    </span>
                  </button>

                  {locationError && (
                    <div className="text-xs text-rose-600 text-center">
                      {locationError}
                    </div>
                  )}
                </div>
              )}

              {locating && !submitting && (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={cancelLocating}
                    className="px-3 py-2 rounded-xl bg-white border text-xs shadow-sm"
                  >
                    Batalkan Pencarian Lokasi
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-2 rounded-lg flex items-start gap-3 text-xs">
              <InformationCircleIcon className="w-5 h-5" />
              <div>
                Pastikan lokasi & koneksi Anda aktif. Jika perangkat meminta izin
                lokasi, pilih <strong>Izinkan</strong>.
              </div>
            </div>
          </div>
        </section>

        {/* ===== Riwayat Absensi (dengan filter) ===== */}
        <section className="mt-5 bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Riwayat {filterLabel}
            </h4>
            <span className="text-xs text-gray-400">
              Total: {summary.total} hari
            </span>
          </div>

          <ul className="mt-3 divide-y divide-gray-100">
            {(riwayatAbsensi || []).map((item) => (
              <li
                key={item.id_absensi}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Masuk: {formatTime(item.jam_masuk)}
                    {item.jam_pulang &&
                      ` • Pulang: ${formatTime(item.jam_pulang)}`}
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    item.status_kehadiran === 'Hadir'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.status_kehadiran === 'Sakit'
                      ? 'bg-yellow-100 text-yellow-700'
                      : item.status_kehadiran === 'Izin'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {item.status_kehadiran}
                </div>
              </li>
            ))}
            {(!riwayatAbsensi || riwayatAbsensi.length === 0) && (
              <li className="py-3 text-sm text-gray-500">Belum ada riwayat.</li>
            )}
          </ul>
        </section>
      </main>

      {/* ===== Fixed bottom CTA (mobile) ===== */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-gradient-to-r from-white/60 to-white/60 backdrop-blur-md border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1">
            {absensiHariIni ? (
              !absensiHariIni.jam_pulang ? (
                <div className="text-xs text-gray-700">
                  {canCheckOut
                    ? 'Sudah boleh absen pulang.'
                    : 'Tunggu waktu absen pulang, lalu tekan tombol.'}
                </div>
              ) : (
                <div className="text-xs text-gray-700">
                  Terima kasih — absensi hari ini lengkap ✔
                </div>
              )
            ) : isTimeUp ? (
              <div className="text-xs text-rose-600">
                Waktu absen masuk telah selesai
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Tekan untuk melakukan absensi masuk
              </div>
            )}
          </div>
          <button
            onClick={handleAbsen}
            disabled={
              submitting ||
              isTimeUp ||
              locating ||
              (absensiHariIni && !absensiHariIni.jam_pulang && !canCheckOut)
            }
            aria-label="Absen cepat"
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-white font-semibold shadow-lg focus:outline-none ${
              submitting ||
              locating ||
              (absensiHariIni && !absensiHariIni.jam_pulang && !canCheckOut)
                ? 'opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:scale-[1.02] transition-transform'
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            <span className="text-sm">
              {submitting || locating
                ? 'Memproses...'
                : absensiHariIni && !absensiHariIni.jam_pulang
                ? 'Absen Pulang'
                : absensiHariIni
                ? 'Sudah Absen'
                : 'Absen Sekarang'}
            </span>
          </button>
        </div>
      </div>

      {/* ===== Modal Peta ===== */}
      {mapOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:w-3/4 lg:w-1/2 bg-white rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-sky-600" />
                <div className="text-sm font-semibold">Peta</div>
                <div className="text-xs text-gray-400 ml-2">
                  ({mapCenterMode === 'student' ? 'Lokasi Saya' : 'Sekolah'})
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMapCenterMode('school');
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    mapCenterMode === 'school'
                      ? 'bg-sky-50 border'
                      : 'bg-white'
                  }`}
                >
                  Sekolah
                </button>
                <button
                  onClick={() => {
                    if (coords) {
                      setMapCenterMode('student');
                    } else {
                      setToast({
                        show: true,
                        message:
                          'Lokasi belum tersedia. Pastikan izin lokasi aktif lalu coba lagi.',
                        type: 'error',
                      });
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    mapCenterMode === 'student'
                      ? 'bg-sky-50 border'
                      : 'bg-white'
                  }`}
                >
                  Lokasi Saya
                </button>
                <button
                  onClick={() => setMapOpen(false)}
                  className="p-2 rounded-md bg-gray-100"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <Suspense
                fallback={
                  <div className="h-64 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    Memuat peta...
                  </div>
                }
              >
                <MapEmbed
                  schoolLat={pengaturan?.lokasi_sekolah_latitude}
                  schoolLng={pengaturan?.lokasi_sekolah_longitude}
                  studentCoords={coords}
                  radius={radiusMeters}
                  small={false}
                  centerMode={mapCenterMode}
                  outsideRadius={outsideRadius}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </SiswaLayout>
  );
}
