import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';

/**
 * Landing page interaktif dengan auto-contrast hero overlay.
 * - Mendeteksi luminance background image (jika memungkinkan)
 * - Jika gambar terang -> pakai overlay gelap & teks putih
 * - Jika gambar gelap  -> pakai overlay terang & teks gelap
 * - Tersedia toggle & slider kecil untuk membuat penyesuaian manual
 */

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  const heroImage = 'https://png.pngtree.com/background/20230522/original/pngtree-3d-rendering-of-a-school-building-picture-image_2685696.jpg'; // ganti sesuai asset kamu

  const announcements = [
    { id: 1, title: 'Ujian Tengah Semester', date: '2025-09-10', body: 'UTS dimulai 10 September — persiapkan materi.' },
    { id: 2, title: 'Libur Nasional', date: '2025-09-21', body: 'Libur nasional — sekolah tutup.' },
    { id: 3, title: 'Rapat Orang Tua', date: '2025-10-02', body: 'Rapat wali murid untuk evaluasi pembelajaran.' },
  ];

  // statistik (contoh; idealnya ambil dari backend via props)
  const statsTarget = {
    siswaAktif: 420,
    guruAktif: 42,
    rataKehadiran: 92.3,
  };

  // animated counters (lebih aman)
  const [siswaCount, setSiswaCount] = useState(0);
  const [guruCount, setGuruCount] = useState(0);
  const [rataCount, setRataCount] = useState(0);

  useEffect(() => {
    let step = 0;
    const maxSteps = 12;
    const interval = setInterval(() => {
      step++;
      setSiswaCount(Math.round((statsTarget.siswaAktif * step) / maxSteps));
      setGuruCount(Math.round((statsTarget.guruAktif * step) / maxSteps));
      setRataCount(Number(((statsTarget.rataKehadiran * step) / maxSteps).toFixed(1)));
      if (step >= maxSteps) clearInterval(interval);
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // carousel pengumuman sederhana
  const [idx, setIdx] = useState(0);
  const carouselRef = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % announcements.length), 4000);
    return () => clearInterval(t);
  }, [announcements.length]);

  // fallback logo
  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/images/logo-placeholder.jpg';
  };

  // ============================
  // Auto-luminance detection
  // ============================
  const [overlayDark, setOverlayDark] = useState(true); // apakah overlay gelap (teks putih) atau terang (teks gelap)
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    // coba load image lalu hitung rata-rata luminance
    // fallback: jika crossOrigin disallowed atau error -> default overlayDark true
    const img = new Image();
    img.crossOrigin = 'anonymous'; // coba akses; boleh gagal di beberapa server
    img.src = heroImage + `?v=${Date.now()}`; // cache-buster

    const handleLoad = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // scale kecil untuk performa
        const w = 100;
        const h = Math.round((img.height / img.width) * w) || 60;
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let totalL = 0;
        const pxCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // luminance formula (perceptual)
          const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          totalL += l;
        }
        const avgL = totalL / pxCount; // 0..255
        // threshold: kalau rata-rata > 140 -> gambar relatif terang -> butuh overlay gelap
        const needDarkOverlay = avgL > 140;
        setOverlayDark(needDarkOverlay);
        setDetected(true);
      } catch (err) {
        // kemungkinan cross-origin gagal -> fallback aman
        setOverlayDark(true);
        setDetected(false);
      }
    };

    const handleError = () => {
      setOverlayDark(true);
      setDetected(false);
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    // cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [heroImage]);

  // styling kondisional untuk teks / shadow
  const heroTextColorClass = overlayDark ? 'text-white' : 'text-slate-900';
  const heroSubTextClass = overlayDark ? 'text-white/90' : 'text-slate-700';
  const heroBoxBg = overlayDark ? 'bg-white/6' : 'bg-white/90'; // card background on hero right
  const heroTextShadow = overlayDark ? '0 6px 30px rgba(0,0,0,0.45)' : '0 2px 8px rgba(255,255,255,0.85)';

  // small helper to format date indonesian
  const formatDateID = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      <Head title="Selamat Datang - Sistem Absensi" />
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-800 selection:bg-sky-600 selection:text-white">

        {/* header */}
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://alhawari.sch.id/wp-content/uploads/2022/09/cropped-93426637_110276057319782_9125875192608849920_n-removebg-preview-e1663001837240.png"
              alt="Logo Sekolah"
              onError={handleImgError}
              className="h-12 w-12 rounded-md object-cover border shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold text-sky-800">SMK IT ALHAWARI</h1>
              <p className="text-xs text-slate-500">Sistem Informasi Absensi & Akademik</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            {auth?.user ? (
              <Link
                href={route('dashboard')}
                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-white shadow-sm hover:bg-sky-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href={route('login.siswa')} className="rounded-md px-3 py-2 text-sky-700 font-semibold hover:bg-sky-50">
                  Login Siswa
                </Link>
                <Link href={route('login')} className="rounded-md px-3 py-2 text-sky-700 hover:text-sky-900">Login</Link>
                <Link href={route('register')} className="inline-flex items-center gap-2 rounded-md border border-sky-600 px-4 py-2 text-sky-600 hover:bg-sky-50">Register</Link>
              </>
            )}
          </nav>
        </header>

        {/* HERO */}
        <section
          className="relative overflow-hidden"
          style={{
            backgroundImage: `url('${heroImage}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        >
          {/* overlay */}
          <div
            aria-hidden
            style={{
              background: overlayDark
                ? `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity * 0.8}))`
                : `linear-gradient(rgba(255,255,255,${overlayOpacity}), rgba(255,255,255,${overlayOpacity * 0.85}))`,
            }}
            className="absolute inset-0 transition-all duration-300"
          />

          {/* small UI controls: toggle & slider */}
          <div className="absolute right-4 top-4 z-30 flex items-center gap-3 rounded-md bg-white/80 p-2 text-xs shadow-sm backdrop-blur-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={overlayDark}
                onChange={(e) => setOverlayDark(e.target.checked)}
                className="h-4 w-4 rounded accent-sky-600"
                title="Toggle overlay gelap (teks putih) / terang (teks gelap)"
              />
              <span className="whitespace-nowrap">Dark overlay</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.15"
                max="0.9"
                step="0.01"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                aria-label="Overlay opacity"
                className="h-2 w-28"
                title="Atur kegelapan overlay"
              />
            </div>
          </div>

          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1">
                <h2
                  className={`text-3xl sm:text-4xl font-extrabold ${heroTextColorClass}`}
                  style={{ textShadow: heroTextShadow }}
                >
                  Absensi & Manajemen Sekolah — Mudah, Cepat, Akurat
                </h2>

                <p
                  className={`mt-4 max-w-2xl ${heroSubTextClass}`}
                  style={{ textShadow: overlayDark ? 'none' : '0 1px 2px rgba(255,255,255,0.85)' }}
                >
                  Catat kehadiran siswa dan guru, lihat statistik realtime, ekspor laporan PDF / Excel, dan pantau tren kehadiran — semua dalam satu tempat.
                </p>

                <div className="mt-6 flex gap-3">
                  <Link
                    href={route('login')}
                    className={`inline-flex items-center gap-2 rounded-md px-5 py-3 shadow ${overlayDark ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
                    style={{ boxShadow: overlayDark ? '0 6px 20px rgba(11,77,160,0.18)' : '0 6px 20px rgba(2,6,23,0.04)' }}
                  >
                    Mulai Absen
                  </Link>

                  <a
                    href="#features"
                    className={`inline-flex items-center gap-2 rounded-md border px-5 py-3 ${overlayDark ? 'border-white/30 text-white' : 'border-slate-200 text-slate-700'} hover:bg-slate-50`}
                  >
                    Lihat Fitur
                  </a>
                </div>

                <div className={`mt-6 flex gap-4 text-sm ${overlayDark ? 'text-white/90' : 'text-slate-700'}`}>
                  <div className="inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 10-4 0v6M9 17h6m-6 0v2m0 0h6m-6 0H5" /></svg>
                    <span>Terintegrasi dengan data siswa & guru</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-3.866 0-7 3.134-7 7 0 .982.2 1.91.557 2.753M12 8c3.866 0 7 3.134 7 7 0 .982-.2 1.91-.557 2.753M12 8v8" /></svg>
                    <span>Ekspor cepat: PDF & Excel yang rapi</span>
                  </div>
                </div>
              </div>

              <div className={`w-full max-w-md p-4 rounded-xl shadow-lg ${overlayDark ? 'bg-white/6 border border-white/10' : 'bg-white/95 border'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-sky-50 rounded">
                    <div className="text-xs text-slate-500">Siswa Aktif</div>
                    <div className="mt-2 text-2xl font-bold text-sky-700">{siswaCount.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-sky-50 rounded">
                    <div className="text-xs text-slate-500">Guru Aktif</div>
                    <div className="mt-2 text-2xl font-bold text-sky-700">{guruCount.toLocaleString()}</div>
                  </div>
                  <div className="col-span-2 p-4 bg-white rounded border">
                    <div className="text-xs text-slate-500">Rata-rata Kehadiran</div>
                    <div className="mt-2 text-2xl font-bold text-sky-700">{Number(rataCount).toFixed(1)}%</div>
                    <div className="mt-2 text-xs text-slate-400">Target sekolah: 90%</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  <strong>Catatan:</strong> klik <span className="font-medium">Mulai Absen</span> untuk menuju halaman login / absensi.
                </div>
              </div>
            </div>
          </div>

          {/* subtle bottom gradient to make hero->content transition smooth */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: overlayDark ? 'linear-gradient(transparent, rgba(0,0,0,0.12))' : 'linear-gradient(transparent, rgba(255,255,255,0.9))' }} />
        </section>

        {/* FEATURES & ANNOUNCEMENTS */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-sky-800">Fitur Unggulan</h3>
              <p className="text-slate-600">Dirancang untuk memudahkan aktivitas administrasi & kehadiran di lingkungan sekolah.</p>

              <div className="mt-4 grid gap-3">
                <FeatureCard title="Absensi Siswa" desc="Absensi masuk/keluar siswa, catatan izin & sakit, tampilkan rekap per kelas." icon="student" />
                <FeatureCard title="Absensi Guru" desc="Rekap kehadiran guru, cuti, dan laporan kehadiran bulanan." icon="teacher" />
                <FeatureCard title="Laporan & Eksport" desc="Ekspor PDF & Excel rapi untuk laporan bulanan dan arsip." icon="report" />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-sky-800">Pengumuman Terbaru</h3>
                <div className="text-sm text-slate-500">Auto-rotate every 4s</div>
              </div>

              <div ref={carouselRef} className="bg-white rounded-lg p-4 shadow">
                <article className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-sky-700">{announcements[idx].title}</h4>
                      <div className="text-xs text-slate-400">{formatDateID(announcements[idx].date)}</div>
                    </div>
                    <div className="text-sm text-slate-600">#{announcements[idx].id}</div>
                  </div>
                  <p className="text-sm text-slate-700">{announcements[idx].body}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setIdx((i) => (i - 1 + announcements.length) % announcements.length)} className="px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200">Prev</button>
                    <button onClick={() => setIdx((i) => (i + 1) % announcements.length)} className="px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200">Next</button>
                    <Link href={route('login')} className="ml-auto inline-flex items-center gap-2 rounded px-3 py-1 bg-sky-600 text-white">Login untuk detail</Link>
                  </div>
                </article>
              </div>

              {/* Gallery / logos or quick links */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow flex items-center gap-3">
                  <img src="/images/teacher.jpg" alt="teacher" className="h-16 w-16 rounded object-cover" onError={handleImgError} />
                  <div>
                    <div className="text-sm font-semibold text-sky-800">Kegiatan Guru</div>
                    <div className="text-xs text-slate-500">Jadwal & rekap kehadiran</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow flex items-center gap-3">
                  <img src="/images/classroom.jpg" alt="classroom" className="h-16 w-16 rounded object-cover" onError={handleImgError} />
                  <div>
                    <div className="text-sm font-semibold text-sky-800">Kelas & Siswa</div>
                    <div className="text-xs text-slate-500">Daftar siswa dan rekap per kelas</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sky-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold">Siap meningkatkan kedisiplinan kehadiran?</h4>
              <p className="text-sm text-sky-100/90">Gunakan fitur absensi berbasis web yang cepat dan mudah digunakan oleh guru & staf.</p>
            </div>
            <div className="flex gap-3">
              <Link href={route('register')} className="rounded-md bg-white px-4 py-2 text-sky-700 font-semibold">Daftar Sekarang</Link>
              <Link href={route('login')} className="rounded-md border border-white/30 px-4 py-2">Masuk</Link>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} SMK IT ALHAWARI — Sistem Absensi. Semua hak dilindungi.
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>Laravel v{laravelVersion}</div>
              <div>•</div>
              <div>PHP v{phpVersion}</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ---------- FeatureCard ---------- */
function FeatureCard({ title, desc, icon = 'star' }) {
  const icons = {
    student: (
      <svg className="h-6 w-6 text-sky-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" /><path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    teacher: (
      <svg className="h-6 w-6 text-sky-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M10 11h4M6 21h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    report: (
      <svg className="h-6 w-6 text-sky-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
    ),
    star: (
      <svg className="h-6 w-6 text-sky-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" /></svg>
    ),
  };

  return (
    <div className="flex gap-3 items-start rounded-lg border p-3 bg-white shadow-sm">
      <div className="p-2 rounded bg-sky-50">{icons[icon] ?? icons.star}</div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}
