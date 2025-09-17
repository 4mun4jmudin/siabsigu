// import React, { useState, useEffect } from 'react';
// import { Head, useForm, usePage } from '@inertiajs/react';
// import SiswaLayout from '@/Layouts/SiswaLayout';
// import {
//   ClockIcon,
//   CheckCircleIcon,
//   InformationCircleIcon,
//   BellIcon,
//   MapPinIcon,
// } from '@heroicons/react/24/solid';
// import { motion, AnimatePresence } from 'framer-motion';

// // ---------- CONFIG ----------
// // Ganti koordinat sekolah ini dengan lokasi sekolah Anda (lat, lon)
// const SCHOOL_COORDS = { lat: -6.200000, lng: 106.816666 }; // contoh: Jakarta, ubah sesuai sekolah

// // ---------- Helpers ----------
// function haversineDistance(lat1, lon1, lat2, lon2) {
//   // returns meters
//   const toRad = (v) => (v * Math.PI) / 180;
//   const R = 6371000; // Earth radius in meters
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // ---------- Digital Clock (small, performant) ----------
// const DigitalClock = ({ className = '' }) => {
//   const [time, setTime] = useState(new Date());

//   useEffect(() => {
//     const timerId = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(timerId);
//   }, []);

//   return (
//     <div className={`flex flex-col items-center ${className}`}>
//       <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-semibold text-gray-900 tracking-wider">
//         {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
//       </div>
//       <div className="text-xs sm:text-sm text-gray-500 mt-1">
//         {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
//       </div>
//     </div>
//   );
// };

// export default function Absensi({ siswa, absensiHariIni }) {
//   // useForm with fields for location so we can submit them
//   const { data, setData, post, processing } = useForm({ lat: '', lng: '', accuracy: '' });
//   const { flash } = usePage().props;

//   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
//   const [openConfirm, setOpenConfirm] = useState(false);
//   const [locState, setLocState] = useState({ status: 'idle', lat: null, lng: null, accuracy: null, error: null });

//   useEffect(() => {
//     if (flash?.success || flash?.error) {
//       const message = flash.success || flash.error;
//       const type = flash.success ? 'success' : 'error';
//       setToast({ show: true, message, type });

//       const timer = setTimeout(() => {
//         setToast(prev => ({ ...prev, show: false }));
//       }, 3000);

//       return () => clearTimeout(timer);
//     }
//   }, [flash]);

//   const getLocation = () => {
//     if (!('geolocation' in navigator)) {
//       setLocState({ status: 'error', error: 'Browser tidak mendukung geolokasi.' });
//       return;
//     }

//     setLocState({ status: 'loading', lat: null, lng: null, accuracy: null, error: null });

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const lat = pos.coords.latitude;
//         const lng = pos.coords.longitude;
//         const accuracy = pos.coords.accuracy; // meters

//         setLocState({ status: 'ready', lat, lng, accuracy, error: null });
//         // simpan ke useForm sehingga ikut terkirim
//         setData('lat', String(lat));
//         setData('lng', String(lng));
//         setData('accuracy', String(Math.round(accuracy)));
//       },
//       (err) => {
//         let message = 'Gagal mengambil lokasi.';
//         if (err.code === 1) message = 'Izin lokasi ditolak. Izinkan akses lokasi untuk melakukan absen.';
//         if (err.code === 3) message = 'Permintaan lokasi timeout. Coba lagi.';
//         setLocState({ status: 'error', lat: null, lng: null, accuracy: null, error: message });
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const handleAbsen = (e) => {
//     e?.preventDefault();
//     setOpenConfirm(false);

//     // Pastikan data lokasi terpasang (jika tersedia)
//     // useForm sudah berisi lat/lng/accuracy jika getLocation sukses
//     post(route('siswa.absensi.store'));
//   };

//   const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
//     weekday: 'long',
//     day: 'numeric',
//     month: 'long',
//     year: 'numeric',
//   });

//   // radius dari global settings jika ada, fallback 200m
//   const allowedRadius = Number(window?.APP_SETTINGS?.radius_absen_meters ?? 200);

//   // hitung jarak jika lokasi ready
//   const distance = locState.status === 'ready' ? haversineDistance(locState.lat, locState.lng, SCHOOL_COORDS.lat, SCHOOL_COORDS.lng) : null;
//   const withinRadius = distance === null ? false : distance <= allowedRadius;

//   return (
//     <SiswaLayout header="Absensi">
//       <Head title="Absensi Siswa" />

//       {/* Toast */}
//       <AnimatePresence>
//         {toast.show && (
//           <motion.div
//             initial={{ opacity: 0, y: -12 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -12 }}
//             className={`fixed top-5 right-5 z-50 w-full max-w-xs p-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
//             <div className="text-sm font-medium">{toast.message}</div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <main className="px-4 sm:px-6 lg:px-8 max-w-xl mx-auto -mt-6">
//         <div className="bg-transparent py-4">
//           {/* Header: profile + notifications */}
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <img
//                 src={siswa.foto_profil ? `/storage/${siswa.foto_profil}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.nama_lengkap)}&background=6366f1&color=fff`}
//                 alt="Profil"
//                 className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
//               />
//               <div>
//                 <div className="text-sm text-gray-600">Halo,</div>
//                 <div className="text-base font-semibold text-gray-900 leading-tight">{siswa.nama_panggilan || siswa.nama_lengkap}</div>
//                 <div className="text-xs text-gray-400">{siswa.kelas.tingkat} {siswa.kelas.jurusan} • NIS {siswa.nis}</div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <button aria-label="Notifikasi" className="relative p-2 rounded-lg hover:bg-gray-100">
//                 <BellIcon className="w-6 h-6 text-gray-600" />
//                 <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-1 ring-white" />
//               </button>
//             </div>
//           </div>

//           {/* Card */}
//           <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
//             <div className="flex items-center justify-between gap-4">
//               <div className="flex items-center gap-4">
//                 <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-white shadow-inner">
//                   <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
//                     <ClockIcon className="w-5 h-5 text-sky-600" />
//                   </div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-gray-500">Tanggal</div>
//                   <div className="text-sm font-medium text-gray-900">{tanggalHariIni}</div>
//                 </div>
//               </div>

//               <div className="hidden sm:block">
//                 <DigitalClock />
//               </div>
//             </div>

//             {/* Mobile clock below for narrow screens */}
//             <div className="sm:hidden mt-4">
//               <DigitalClock />
//             </div>

//             {/* Absensi Status / Action */}
//             <div className="mt-5">
//               {absensiHariIni ? (
//                 <motion.div
//                   initial={{ opacity: 0, y: 6 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 p-3 rounded-lg flex items-start gap-3"
//                   role="status"
//                 >
//                   <CheckCircleIcon className="w-6 h-6 mt-0.5 text-emerald-600" />
//                   <div>
//                     <div className="font-semibold">Anda Sudah Absen</div>
//                     <div className="text-xs text-gray-600">
//                       Terekam pukul <strong>{new Date(`1970-01-01T${absensiHariIni.jam_masuk}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
//                     </div>
//                   </div>
//                 </motion.div>
//               ) : (
//                 <div className="mt-1">
//                   <p className="text-sm text-gray-600 mb-3">Tekan tombol untuk merekam kehadiran. Pastikan lokasi & jam sesuai.</p>

//                   {/* Lokasi + Map preview */}
//                   <div className="mb-3">
//                     {locState.status === 'idle' && (
//                       <div className="flex gap-2">
//                         <button onClick={getLocation} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700">Ambil Lokasi Sekarang</button>
//                         <button onClick={() => setLocState({ status: 'idle', lat: null, lng: null, accuracy: null, error: null })} className="px-3 py-2 rounded-xl border border-gray-200">Reset</button>
//                       </div>
//                     )}

//                     {locState.status === 'loading' && (
//                       <div className="text-sm text-gray-600">Mengambil lokasi... (pastikan izin lokasi diberikan)</div>
//                     )}

//                     {locState.status === 'error' && (
//                       <div className="text-sm text-rose-600">{locState.error}</div>
//                     )}

//                     {locState.status === 'ready' && (
//                       <div className="mt-2 grid grid-cols-1 gap-2">
//                         <div className="text-sm text-gray-600">Lokasi terdeteksi: <span className="font-medium text-gray-800">{locState.lat.toFixed(6)}, {locState.lng.toFixed(6)}</span> (±{Math.round(locState.accuracy)} m)</div>

//                         <div className="rounded-lg overflow-hidden border border-gray-100">
//                           <iframe
//                             title="Map preview"
//                             src={`https://www.openstreetmap.org/export/embed.html?bbox=${locState.lng - 0.002},${locState.lat - 0.002},${locState.lng + 0.002},${locState.lat + 0.002}&layer=mapnik&marker=${locState.lat},${locState.lng}`}
//                             className="w-full h-40"
//                             loading="lazy"
//                           />
//                           <div className="p-2 text-xs text-gray-500">Preview lokasi (OpenStreetMap). Jika peta kosong, cek izin browser atau jaringan.</div>
//                         </div>

//                         <div className="flex items-center justify-between text-sm">
//                           <div>Jarak ke sekolah:</div>
//                           <div className="font-medium">{distance !== null ? `${Math.round(distance)} m` : '—'}</div>
//                         </div>

//                         <div className="text-sm">
//                           <span className={`font-medium ${withinRadius ? 'text-emerald-600' : 'text-rose-600'}`}>{withinRadius ? 'Dalam radius absen' : 'Di luar radius absen'}</span>
//                           <span className="ml-2 text-xs text-gray-500">(radius yang diizinkan: {allowedRadius} m)</span>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   <motion.button
//                     whileTap={{ scale: 0.98 }}
//                     whileHover={{ scale: 1.02 }}
//                     onClick={() => setOpenConfirm(true)}
//                     disabled={processing || locState.status !== 'ready' || !withinRadius}
//                     className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-200 transition-shadow shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 00.293.707l2 2a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" />
//                     </svg>
//                     {processing ? 'Memproses...' : 'Absen Masuk Sekarang'}
//                   </motion.button>

//                   {(!withinRadius && locState.status === 'ready') && (
//                     <div className="mt-2 text-xs text-rose-600">Lokasi Anda berada di luar area yang diizinkan. Mintalah admin mengubah radius atau hubungi petugas.</div>
//                   )}

//                 </div>
//               )}
//             </div>

//             {/* Informational row */}
//             <div className="mt-4 grid grid-cols-1 gap-3">
//               <div className="flex items-start gap-3 bg-sky-50 border border-sky-100 text-sky-800 px-3 py-2 rounded-lg">
//                 <InformationCircleIcon className="w-5 h-5 mt-0.5 text-sky-600" />
//                 <div className="text-sm">Pastikan absen dilakukan sesuai jam & area sekolah untuk menghindari keterlambatan.</div>
//               </div>

//               <div className="flex items-center gap-3 bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm">
//                 <MapPinIcon className="w-5 h-5 text-gray-500" />
//                 <div className="text-sm text-gray-600">Radius absen: <span className="font-medium text-gray-900">{allowedRadius} m</span></div>
//               </div>
//             </div>
//           </div>

//           {/* Footer small actions */}
//           <div className="mt-4 flex items-center justify-between gap-3">
//             <button className="flex-1 text-sm text-gray-700 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">Riwayat</button>
//             <button className="flex-1 text-sm text-gray-700 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">Keterangan</button>
//           </div>

//         </div>
//       </main>

//       {/* Confirmation Modal */}
//       <AnimatePresence>
//         {openConfirm && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
//           >
//             <div className="absolute inset-0 bg-black/40" onClick={() => setOpenConfirm(false)} />

//             <motion.div
//               initial={{ y: 40, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 40, opacity: 0 }}
//               className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl"
//             >
//               <div className="flex items-start gap-3">
//                 <div className="p-2 rounded-full bg-sky-50">
//                   <ClockIcon className="w-6 h-6 text-sky-600" />
//                 </div>
//                 <div>
//                   <div className="font-semibold">Konfirmasi Absen</div>
//                   <div className="text-sm text-gray-500">Tekan "Absen Sekarang" untuk merekam kehadiran Anda hari ini. Lokasi Anda akan dikirimkan bersama data absen.</div>
//                 </div>
//               </div>

//               <div className="mt-4 flex items-center gap-3">
//                 <button onClick={() => setOpenConfirm(false)} className="flex-1 py-2 rounded-lg border border-gray-200">Batal</button>
//                 <button onClick={handleAbsen} className="flex-1 py-2 rounded-lg bg-sky-600 text-white">Absen Sekarang</button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </SiswaLayout>
//   );
// }
