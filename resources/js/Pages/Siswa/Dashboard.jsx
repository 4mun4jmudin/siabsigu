import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import {
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  NoSymbolIcon,
  MapPinIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  ClockIcon as ClockSolid,
  MapPinIcon as MapPinSolid,
} from '@heroicons/react/24/solid';

/**
 * Dashboard Absensi Siswa (Final Version)
 * - UI: Modern, Glassmorphism, Responsive.
 * - Logic: Absen Masuk, Pulang, Geolocation, Time Checking (Terlambat & Terlalu Cepat).
 * - Update: Validasi Waktu Pulang (15 menit sebelum jam pulang).
 */

// ===================== HELPERS =====================
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
    if (timeStr.includes(':') && !timeStr.includes('T')) {
      const [h, m] = timeStr.split(':');
      return `${h}:${m}`;
    }
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const d = new Date(`1970-01-01T${timeStr}`);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <div className="flex flex-col items-center justify-center py-8 relative overflow-hidden group">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-sky-100 rounded-full blur-3xl opacity-50 -z-10 group-hover:scale-125 transition-transform duration-700"></div>
        <div className="font-mono text-5xl sm:text-7xl font-black text-slate-800 tracking-tighter select-none drop-shadow-sm transition-all">
            {timeString}
        </div>
        <div className="mt-2 text-sm font-semibold text-slate-500 uppercase tracking-widest bg-white/60 px-4 py-1.5 rounded-full border border-slate-200/60 backdrop-blur-sm shadow-sm">
            {dateString}
        </div>
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
    <div className="fixed z-[100] top-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-none">
      <div
        className={`px-6 py-4 rounded-2xl shadow-2xl font-medium text-white flex items-center gap-3 transition-all transform animate-in slide-in-from-top-5 duration-300 pointer-events-auto ${
          type === 'success' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-rose-600 shadow-rose-900/20'
        }`}
        role="status"
        aria-live="polite"
      >
        {type === 'success' ? <CheckCircleIcon className="w-6 h-6 shrink-0"/> : <InformationCircleIcon className="w-6 h-6 shrink-0"/>}
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

// ===================== GEOLOCATION HELPER =====================
function getPrecisePosition({ desiredAccuracy = 30, timeout = 30000 } = {}) {
  let watchId = null;
  let timer = null;
  let best = null;
  let resolved = false;

  let resolveFn, rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;

    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));

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
        reject(new Error('Timeout getting location'));
      }
    }, timeout);
  });

  return {
    promise,
    stop: () => {
      try {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      } catch (e) { }
      if (!resolved && rejectFn) rejectFn(new Error('Cancelled by user'));
      if (timer) clearTimeout(timer);
    },
  };
}

// ===================== MAP COMPONENT =====================
function MapEmbed({
  schoolLat,
  schoolLng,
  studentCoords,
  radius = 200,
  small = true,
  centerMode = 'school',
}) {
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
        } catch (e) { }
        if (!mounted) return;
        setComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          Marker: mod.Marker,
          Popup: mod.Popup,
          Circle: mod.Circle,
        });
      } catch (err) {
        console.warn('react-leaflet not available', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const schoolCenter = schoolLat && schoolLng ? [parseFloat(schoolLat), parseFloat(schoolLng)] : null;
  const studentCenter = studentCoords && typeof studentCoords.latitude === 'number'
      ? [studentCoords.latitude, studentCoords.longitude]
      : null;

  const center = centerMode === 'student' && studentCenter ? studentCenter : schoolCenter || studentCenter;
  const iframeSrc = center ? `https://www.google.com/maps?q=${center[0]},${center[1]}&z=16&output=embed` : null;

  if (components && center) {
    const { MapContainer, TileLayer, Marker, Popup, Circle } = components;
    return (
      <div className={`${small ? 'h-52' : 'h-96'} w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative z-0`}>
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {schoolCenter && (
            <Marker position={schoolCenter}>
              <Popup>Titik Sekolah</Popup>
            </Marker>
          )}
          {studentCenter && (
            <>
              <Marker position={studentCenter}>
                <Popup>Lokasi Anda <br/> Akurasi: {studentCoords?.accuracy}m</Popup>
              </Marker>
              <Circle center={studentCenter} radius={Math.max(10, studentCoords.accuracy)} pathOptions={{ color: '#0ea5a4', fillOpacity: 0.2 }} />
            </>
          )}
          {schoolCenter && (
            <Circle center={schoolCenter} radius={parseInt(radius || 200, 10)} pathOptions={{ color: '#7c3aed', fillOpacity: 0.1 }} />
          )}
        </MapContainer>
      </div>
    );
  }

  if (iframeSrc) {
    return (
      <div className={`${small ? 'h-52' : 'h-64'} rounded-2xl overflow-hidden border border-slate-200`}>
        <iframe title="Peta" src={iframeSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
      </div>
    );
  }

  return (
    <div className={`${small ? 'h-52' : 'h-64'} flex items-center justify-center text-xs text-slate-400 border border-slate-200 rounded-2xl bg-slate-50`}>
      {schoolLat ? 'Memuat Peta...' : 'Koordinat sekolah belum diatur.'}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function SiswaDashboard({
  siswa = {},
  absensiHariIni = null,
  riwayatAbsensi = [],
  batasWaktuAbsen = null,
  pengaturan = null,
}) {
  const { flash } = usePage().props;

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null);
  const [distanceToSchool, setDistanceToSchool] = useState(null);
  
  // States Waktu
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isTooEarly, setIsTooEarly] = useState(false); // State "Belum Waktunya" (Masuk/Pulang)
  const [earlyTimeStr, setEarlyTimeStr] = useState(''); // Jam mulai absen (Masuk/Pulang)

  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenterMode, setMapCenterMode] = useState('school');
  
  // Status Loading
  const [locating, setLocating] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const locateRequestRef = useRef(null);
  const [historyFilter, setHistoryFilter] = useState('month');

  // Effect Flash Message
  useEffect(() => {
    if (flash?.success) setToast({ show: true, message: flash.success, type: 'success' });
    if (flash?.error) setToast({ show: true, message: flash.error, type: 'error' });
  }, [flash]);

  // Reset Coords jika sudah pulang
  useEffect(() => {
    if (absensiHariIni && absensiHariIni.jam_pulang) {
      setCoords(null);
      setDistanceToSchool(null);
    }
  }, [absensiHariIni]);

  // Logic Cek Waktu (Interval 10 detik)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();

      // Case 1: Sudah Selesai (Masuk & Pulang Tuntas)
      if (absensiHariIni && absensiHariIni.jam_pulang) {
        setIsTimeUp(false);
        setIsTooEarly(false);
        return;
      }

      // Case 2: Sudah Absen Masuk, Mau Absen Pulang (Cek Waktu Pulang)
      if (absensiHariIni && !absensiHariIni.jam_pulang) {
         setIsTimeUp(false); // Tidak ada batas akhir untuk pulang (biasanya)
         
         if (pengaturan?.jam_pulang_siswa) {
             const [h, m] = pengaturan.jam_pulang_siswa.split(':').map(Number);
             const exitTime = new Date();
             exitTime.setHours(h, m || 0, 0, 0);
             
             // 15 menit sebelum jam pulang
             const allowedTime = new Date(exitTime.getTime() - 15 * 60000); 
             const startStr = allowedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
             setEarlyTimeStr(startStr);

             if (now < allowedTime) {
                setIsTooEarly(true);
             } else {
                setIsTooEarly(false);
             }
         }
         return;
      }

      // Case 3: Belum Absen Masuk (Cek Waktu Masuk)
      if (!absensiHariIni) {
          // 1. Cek Batas Akhir (Waktu Habis / Telat)
          if (batasWaktuAbsen) {
            const [h, m] = batasWaktuAbsen.split(':').map(Number);
            const deadline = new Date();
            deadline.setHours(h, m || 0, 0, 0);
            setIsTimeUp(now > deadline);
          }

          // 2. Cek Batas Awal (Belum Waktunya Masuk) - 15 Menit Sebelum Masuk
          if (pengaturan?.jam_masuk_siswa) {
             const [h, m] = pengaturan.jam_masuk_siswa.split(':').map(Number);
             const entryTime = new Date();
             entryTime.setHours(h, m || 0, 0, 0);
             
             const allowedTime = new Date(entryTime.getTime() - 15 * 60000); 
             const startStr = allowedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
             setEarlyTimeStr(startStr);

             if (now < allowedTime) {
                setIsTooEarly(true);
             } else {
                setIsTooEarly(false);
             }
          }
      }
    };

    checkTime();
    const id = setInterval(checkTime, 10000);
    return () => clearInterval(id);
  }, [batasWaktuAbsen, absensiHariIni, pengaturan]);

  const summary = useMemo(() => {
    const last30 = (riwayatAbsensi || []).slice(0, 30);
    return {
      hadir: last30.filter((r) => r.status_kehadiran === 'Hadir').length,
      sakit: last30.filter((r) => r.status_kehadiran === 'Sakit').length,
      izin: last30.filter((r) => r.status_kehadiran === 'Izin').length,
      alfa: last30.filter((r) => r.status_kehadiran === 'Alfa').length,
      total: last30.length,
    };
  }, [riwayatAbsensi]);

  const filteredRiwayat = useMemo(() => {
    const list = riwayatAbsensi || [];
    if (!list.length) return [];
    const now = new Date();
    let daysLimit = historyFilter === 'week' ? 7 : historyFilter === 'month' ? 30 : 365;
    return list.filter((item) => {
      if (!item.tanggal) return false;
      const t = new Date(item.tanggal);
      const diffMs = now - t;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= daysLimit;
    });
  }, [riwayatAbsensi, historyFilter]);

  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleAbsen = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLocationError('');
    setToast({ show: false, message: '', type: 'success' });

    const modeAbsen = absensiHariIni && !absensiHariIni.jam_pulang ? 'pulang' : 'masuk';

    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS.');
      return;
    }

    let finalLat = null, finalLng = null, finalAcc = null, finalTs = null;

    if (coords && coords.latitude && coords.longitude) {
       console.log("Using cached location");
       finalLat = coords.latitude;
       finalLng = coords.longitude;
       finalAcc = coords.accuracy;
       finalTs  = coords.timestamp;
    } else {
       setLocating(true);
       setToast({ show: true, message: 'Mencari titik GPS...', type: 'success' });
       try {
         const req = getPrecisePosition({ desiredAccuracy: 50, timeout: 10000 });
         locateRequestRef.current = req;
         const pos = await req.promise;
         finalLat = pos.coords.latitude;
         finalLng = pos.coords.longitude;
         finalAcc = Math.round(pos.coords.accuracy);
         finalTs  = pos.timestamp;
         setCoords({ latitude: finalLat, longitude: finalLng, accuracy: finalAcc, timestamp: finalTs });
         setMapCenterMode('student');
       } catch (err) {
         setLocating(false);
         const errMsg = err.message || 'Gagal mengunci GPS. Pastikan izin lokasi aktif.';
         setLocationError(errMsg);
         setToast({ show: true, message: errMsg, type: 'error' });
         return; 
       }
    }

    setLocating(false);
    locateRequestRef.current = null;

    if (pengaturan?.lokasi_sekolah_latitude && pengaturan?.lokasi_sekolah_longitude) {
        const dist = Math.round(getDistanceMeters(parseFloat(pengaturan.lokasi_sekolah_latitude), parseFloat(pengaturan.lokasi_sekolah_longitude), finalLat, finalLng));
        setDistanceToSchool(dist);
        const allowed = parseInt(pengaturan.radius_absen_meters || 200, 10);
        if (dist > allowed) {
            setToast({ show: true, message: `Jarak ${dist}m (Max ${allowed}m). Terlalu jauh!`, type: 'error' });
            return;
        }
    }

    const payload = {
        latitude: String(finalLat),
        longitude: String(finalLng),
        accuracy: String(finalAcc),
        mode: modeAbsen,
    };

    router.post(route('siswa.absensi.store'), payload, {
        preserveScroll: true,
        onStart: () => {
            setIsSubmitting(true);
            setToast({ show: true, message: 'Menghubungi server...', type: 'success' });
        },
        onFinish: () => {
            setIsSubmitting(false);
        },
        onSuccess: () => {
             setToast({ show: true, message: 'Berhasil disimpan! ✔', type: 'success' });
        },
        onError: (errors) => {
             const msg = errors.latitude || errors.longitude || errors.message || 'Terjadi kesalahan sistem.';
             setToast({ show: true, message: msg, type: 'error' });
             setLocationError(msg);
        }
    });
  };

  const cancelLocating = () => {
    if (locateRequestRef.current) {
      locateRequestRef.current.stop();
      locateRequestRef.current = null;
      setLocating(false);
      setToast({ show: true, message: 'Dibatalkan', type: 'error' });
    }
  };

  const profilePhotoUrl = siswa?.foto_profil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa?.nama_lengkap || 'Siswa')}&background=0ea5e9&color=fff`;
  const isCheckedIn = !!absensiHariIni;
  const isCheckedOut = absensiHariIni && !!absensiHariIni.jam_pulang;

  return (
    <SiswaLayout header="Dashboard" className="bg-slate-50 font-sans">
      <Head title="Dashboard Siswa" />
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast((s) => ({ ...s, show: false }))} />

      {/* HERO SECTION */}
      <div className="bg-slate-900 pb-20 pt-8 px-4 sm:px-6 lg:px-8 shadow-xl">
         <div className="max-w-6xl lg:max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                    <img 
                        src={profilePhotoUrl} 
                        alt="Profile" 
                        className="w-20 h-20 md:w-20 md:h-20 rounded-2xl border-4 border-slate-700 shadow-lg object-cover bg-slate-800"
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackAvatarUrl; }} 
                    />
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{siswa?.nama_lengkap}</h2>
                        <div className="text-slate-400 text-sm font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                            <span className="bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">{siswa?.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : 'Siswa'}</span>
                            <span>•</span>
                            <span className="opacity-80">NIS: {siswa?.nis || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Mini Stats (Fixed Mobile) */}
                <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:gap-4 mt-4 md:mt-0">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 md:px-5 text-center border border-slate-700/50 md:min-w-[100px]">
                        <div className="text-xl md:text-2xl font-bold text-white">{summary.hadir}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Hadir</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 md:px-5 text-center border border-slate-700/50 md:min-w-[100px]">
                        <div className="text-xl md:text-2xl font-bold text-white">{summary.sakit + summary.izin}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Izin/Sakit</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 md:px-5 text-center border border-slate-700/50 md:min-w-[100px]">
                        <div className="text-xl md:text-2xl font-bold text-rose-400">{summary.alfa}</div>
                        <div className="text-[10px] uppercase tracking-wider text-rose-400/80 font-bold">Alfa</div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <main className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 -mt-12 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: MAIN ACTION */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                <div className={`h-1.5 w-full ${isCheckedOut ? 'bg-emerald-500' : isCheckedIn ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-50 rounded-lg">
                                <ClockIcon className="w-5 h-5 text-slate-500"/>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">Absensi Hari Ini</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            isCheckedOut ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            isCheckedIn ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                            {isCheckedOut ? 'Selesai' : isCheckedIn ? 'Di Sekolah' : 'Belum Hadir'}
                        </span>
                    </div>

                    <DigitalClock />

                    <div className="mt-8 max-w-lg mx-auto space-y-6">
                        {/* Map Area */}
                        {(pengaturan?.lokasi_sekolah_latitude && !isCheckedOut) && (
                            <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                <Suspense fallback={<div className="h-52 bg-slate-100 animate-pulse rounded-2xl"/>}>
                                    <MapEmbed 
                                        schoolLat={pengaturan.lokasi_sekolah_latitude} 
                                        schoolLng={pengaturan.lokasi_sekolah_longitude}
                                        studentCoords={coords}
                                        radius={pengaturan.radius_absen_meters}
                                        small={true}
                                        centerMode={mapCenterMode}
                                    />
                                </Suspense>
                                
                                <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1]">
                                    <button 
                                        onClick={() => { setMapCenterMode('school'); setMapOpen(true); }}
                                        className="bg-white p-2.5 rounded-xl shadow-md text-slate-500 hover:text-sky-600 transition border border-slate-100"
                                        title="Perbesar Peta"
                                    >
                                        <MapPinSolid className="w-5 h-5"/>
                                    </button>
                                </div>

                                {distanceToSchool !== null && (
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1] bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-md border border-slate-100 flex items-center gap-2">
                                        <span>Jarak ke Sekolah:</span>
                                        <span className={distanceToSchool > (pengaturan?.radius_absen_meters || 200) ? "text-rose-600" : "text-emerald-600"}>{distanceToSchool}m</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TOMBOL ABSEN / STATUS --- */}
                        <div>
                            {isCheckedOut ? (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                                    <div className="bg-white p-3 rounded-full shadow-sm text-emerald-500 border border-emerald-100">
                                        <CheckCircleIcon className="w-8 h-8"/>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-emerald-900 text-lg">Sampai Jumpa Besok!</div>
                                        <div className="text-sm text-emerald-700 opacity-90 mt-1">Terima kasih, data kehadiran Anda hari ini sudah lengkap.</div>
                                        <div className="text-xs mt-3 font-mono font-medium text-emerald-800 bg-white/60 px-3 py-1 rounded-lg border border-emerald-100/50 inline-block">
                                            Masuk: {formatTime(absensiHariIni.jam_masuk)} • Pulang: {formatTime(absensiHariIni.jam_pulang)}
                                        </div>
                                    </div>
                                </div>
                            ) : isTimeUp && !isCheckedIn ? (
                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
                                    <NoSymbolIcon className="w-12 h-12 text-rose-400 mx-auto mb-3"/>
                                    <h3 className="font-bold text-rose-800 text-lg">Batas Waktu Habis</h3>
                                    <p className="text-sm text-rose-600 mt-1 max-w-xs mx-auto">Anda tidak dapat melakukan absen masuk karena waktu telah berakhir. Silakan lapor ke guru piket.</p>
                                </div>
                            ) : isTooEarly ? (
                                // ✅ TAMPILAN JIKA BELUM WAKTUNYA ABSEN (MASUK / PULANG)
                                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 text-center">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-sky-100">
                                        <ClockSolid className="w-6 h-6 text-sky-500"/>
                                    </div>
                                    <h3 className="font-bold text-sky-800 text-lg">
                                        {isCheckedIn ? 'Belum Waktunya Pulang' : 'Absensi Belum Dibuka'}
                                    </h3>
                                    <p className="text-sm text-sky-600 mt-1 max-w-xs mx-auto">
                                        Silakan tunggu. {isCheckedIn ? 'Absensi pulang' : 'Absensi masuk'} akan dibuka pada pukul <strong className="font-mono bg-sky-100 px-1 rounded">{earlyTimeStr}</strong>.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <form onSubmit={handleAbsen}>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || locating}
                                            className={`w-full group relative overflow-hidden rounded-2xl py-4 px-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait ${
                                                isCheckedIn 
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/20' 
                                                : 'bg-gradient-to-r from-sky-500 to-indigo-600 shadow-sky-500/20'
                                            }`}
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-3 text-white">
                                                {(isSubmitting || locating) ? (
                                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : isCheckedIn ? (
                                                    <ArrowRightOnRectangleIcon className="w-6 h-6"/>
                                                ) : (
                                                    <ClockSolid className="w-6 h-6"/>
                                                )}

                                                <div className="text-left">
                                                    <span className="block font-bold text-lg leading-none">
                                                        {locating 
                                                            ? 'Mencari Lokasi...' 
                                                            : isSubmitting 
                                                                ? 'Mengirim Data...' 
                                                                : isCheckedIn ? 'Absen Pulang' : 'Absen Masuk'}
                                                    </span>
                                                    {!isSubmitting && !locating && (
                                                        <span className="text-[10px] uppercase tracking-wider opacity-80 font-medium block mt-1">
                                                            {isCheckedIn ? 'Ketuk untuk pulang' : 'Ketuk untuk masuk'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                                        </button>

                                        {locating && (
                                            <button type="button" onClick={cancelLocating} className="mt-4 w-full text-center text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-rose-500 transition">
                                                Batalkan Pencarian Lokasi
                                            </button>
                                        )}
                                    </form>

                                    {locationError && (
                                        <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-xs font-medium rounded-xl text-center border border-rose-100 animate-fade-in-up">
                                            {locationError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Info Lokasi Text */}
                        {coords && !isCheckedOut && (
                            <div className="flex justify-center items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <MapPinIcon className="w-3.5 h-3.5 text-slate-500"/>
                                    <span>Akurasi GPS: <strong>{coords.accuracy}m</strong></span>
                                </div>
                                <button onClick={() => { setCoords(null); setDistanceToSchool(null); setMapCenterMode('school'); }} className="hover:text-sky-600 font-medium underline decoration-slate-300 underline-offset-2 hover:decoration-sky-600 transition">
                                    Reset GPS
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
          </div>

          {/* KOLOM KANAN: RIWAYAT */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-sky-50 rounded-lg">
                            <CalendarDaysIcon className="w-5 h-5 text-sky-600"/>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Riwayat</h4>
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={historyFilter} 
                            onChange={(e) => setHistoryFilter(e.target.value)}
                            className="appearance-none text-xs font-bold border-slate-200 rounded-lg py-2 pl-3 pr-8 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition"
                        >
                            <option value="week">Minggu Ini</option>
                            <option value="month">Bulan Ini</option>
                            <option value="year">Tahun Ini</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar" style={{maxHeight: '600px'}}>
                    {filteredRiwayat.length > 0 ? filteredRiwayat.map((item) => (
                        <div key={item.id_absensi} className="group relative bg-white border border-slate-100 rounded-2xl p-4 hover:border-sky-200 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">
                                        {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                        {new Date(item.tanggal).getFullYear()}
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                    item.status_kehadiran === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    item.status_kehadiran === 'Sakit' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                    item.status_kehadiran === 'Izin' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                    'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                    {item.status_kehadiran}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2 group-hover:bg-sky-50/50 group-hover:border-sky-100 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="font-mono font-medium">{formatTime(item.jam_masuk)}</span>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2 group-hover:bg-amber-50/50 group-hover:border-amber-100 transition-colors">
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.jam_pulang ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                                    <span className="font-mono font-medium">{formatTime(item.jam_pulang)}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                            <ChartBarIcon className="w-10 h-10 mb-3 opacity-30"/>
                            <p className="text-sm font-medium">Belum ada riwayat</p>
                            <p className="text-xs opacity-70">Data absensi akan muncul di sini</p>
                        </div>
                    )}
                </div>
            </section>
          </div>

        </div>
      </main>

      {/* Floating Action for Mobile (Only visible on small screens) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-200 md:hidden z-50">
         {!isCheckedOut && (!isTimeUp || isCheckedIn) && (
            <button
              onClick={handleAbsen}
              disabled={isSubmitting || locating || isTooEarly} // Disable jika belum waktunya
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform ${
                  isTooEarly 
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' // Style tombol mati
                  : isCheckedIn 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/20' 
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 shadow-sky-500/20'
              } disabled:opacity-70 disabled:cursor-wait`}
            >
                {(isSubmitting || locating) ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : isCheckedIn ? (
                    <ArrowRightOnRectangleIcon className="w-6 h-6"/>
                ) : isTooEarly ? (
                    <ClockSolid className="w-6 h-6"/>
                ) : (
                    <ClockSolid className="w-6 h-6"/>
                )}
                <span>
                    {locating 
                        ? 'Mencari Lokasi...' 
                        : isSubmitting 
                            ? 'Mengirim Data...' 
                            : isTooEarly 
                                ? `Tunggu (${earlyTimeStr})` 
                                : isCheckedIn ? 'Absen Pulang Sekarang' : 'Absen Masuk Sekarang'}
                </span>
            </button>
         )}
         {isCheckedOut && (
             <div className="text-center py-3 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
                 <span className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5"/>
                    Kehadiran Hari Ini Tuntas
                 </span>
             </div>
         )}
      </div>

      {/* Fullscreen Map Modal */}
      {mapOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl transform transition-all scale-100 border border-white/20">
              <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <MapPinSolid className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Peta Lokasi</h3>
                        <p className="text-xs text-slate-500 hidden sm:block">Pastikan posisi Anda berada di dalam lingkaran radius.</p>
                    </div>
                 </div>
                 <button onClick={() => setMapOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="w-7 h-7"/>
                 </button>
              </div>
              <div className="p-0 h-[60vh] md:h-[500px] relative bg-slate-100">
                 <Suspense fallback={<div className="h-full flex items-center justify-center bg-slate-100 text-slate-400 font-medium">Memuat peta...</div>}>
                    <MapEmbed 
                       schoolLat={pengaturan?.lokasi_sekolah_latitude} 
                       schoolLng={pengaturan?.lokasi_sekolah_longitude}
                       studentCoords={coords}
                       radius={pengaturan?.radius_absen_meters}
                       small={false}
                       centerMode={mapCenterMode}
                    />
                 </Suspense>
                 
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-[400]">
                    <button 
                        onClick={() => setMapCenterMode('school')} 
                        className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${mapCenterMode === 'school' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <MapPinSolid className="w-4 h-4"/> Sekolah
                    </button>
                    <button 
                        onClick={() => setMapCenterMode('student')} 
                        className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${mapCenterMode === 'student' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <MapPinSolid className="w-4 h-4"/> Posisi Saya
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </SiswaLayout>
  );
}