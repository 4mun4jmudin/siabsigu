// resources/js/Pages/Welcome.jsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Landing Page Interaktif & Responsif untuk Sistem Absensi Sekolah (SISAB)
 * Fokus: edukatif, cepat diakses, CTA jelas per-peran (Siswa/Guru/Orang Tua/Admin)
 * Catatan: tidak butuh dependency tambahan selain Tailwind + Inertia (route helper diasumsikan tersedia secara global)
 */

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  // ====== Konfigurasi Hero ======
  const heroImage =
    'https://png.pngtree.com/background/20230522/original/pngtree-3d-rendering-of-a-school-building-picture-image_2685696.jpg';

  // Dummy pengumuman (bisa ganti dari server)
  const announcements = [
    { id: 1, title: 'Ujian Tengah Semester', date: '2025-09-10', body: 'UTS dimulai 10 September — persiapkan materi.' },
    { id: 2, title: 'Libur Nasional', date: '2025-09-21', body: 'Libur nasional — sekolah tutup.' },
    { id: 3, title: 'Rapat Orang Tua', date: '2025-10-02', body: 'Rapat wali murid untuk evaluasi pembelajaran.' },
  ];

  // ====== Statistik ======
  const statsTarget = useMemo(() => ({ siswaAktif: 420, guruAktif: 42, rataKehadiran: 92.3 }), []);
  const [siswaCount, setSiswaCount] = useState(0);
  const [guruCount, setGuruCount] = useState(0);
  const [rataCount, setRataCount] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setSiswaCount(statsTarget.siswaAktif);
      setGuruCount(statsTarget.guruAktif);
      setRataCount(statsTarget.rataKehadiran);
      return;
    }
    // animasi counter ringan dengan rAF
    const duration = 700; // ms
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setSiswaCount(Math.round(statsTarget.siswaAktif * easeOutCubic(p)));
      setGuruCount(Math.round(statsTarget.guruAktif * easeOutCubic(p)));
      setRataCount(Number((statsTarget.rataKehadiran * easeOutCubic(p)).toFixed(1)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [statsTarget]);

  // ====== Carousel Pengumuman ======
  const [idx, setIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const currentAnn = announcements[idx] ?? announcements[0];
  useEffect(() => {
    if (carouselPaused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % announcements.length), 4500);
    return () => clearInterval(t);
  }, [announcements.length, carouselPaused]);

  // ====== Kontrol Visual Hero ======
  const [overlayDark, setOverlayDark] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [showVisualControls, setShowVisualControls] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = heroImage + `?v=${Date.now()}`;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = 80;
        const ratio = img.width ? img.height / img.width : 0.6;
        const h = Math.max(40, Math.round(w * ratio));
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        const avg = total / (data.length / 4);
        setOverlayDark(avg > 140);
      } catch (e) {
        setOverlayDark(true);
      }
    };
    img.onerror = () => setOverlayDark(true);
  }, []);

  const handleResetVisuals = () => {
    setBrightness(1);
    setContrast(1);
    setOverlayOpacity(0.55);
    setOverlayDark(true);
  };

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/images/logo-placeholder.jpg';
  };

  // ====== Aksesibilitas & kecil-kecil cabe rawit ======
  const formatDateID = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const sparkData = [5, 7, 6, 8, 9, 7, 10];

  // Scroll reveal sederhana
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    nodes.forEach((n) => {
      n.classList.add('reveal');
      observer.observe(n);
    });
    return () => observer.disconnect();
  }, []);

  // Sticky header shrink
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ====== Render ======
  return (
    <>
      <Head title="Selamat Datang - Sistem Absensi" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-sky-700 text-white px-3 py-2 rounded">Lewati ke konten utama</a>

      <style>{`
        .reveal { opacity: 0; transform: translateY(14px) scale(0.995); transition: opacity 520ms cubic-bezier(.2,.9,.2,1), transform 520ms cubic-bezier(.2,.9,.2,1); will-change: transform,opacity; }
        .reveal-visible { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-visible { transition: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-sky-600 selection:text-white">
        {/* ===== Header ===== */}
        <header className={`sticky top-0 z-50 transition-all ${isScrolled ? 'backdrop-blur bg-white/70 shadow-sm' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://tse1.mm.bing.net/th/id/OIP.D00vtlc9GfNrCcZL28_R1gHaHa?pid=Api&P=0&h=180"
                alt="Logo Sekolah"
                className="h-10 w-10 rounded-md object-cover shadow-sm border"
                onError={handleImgError}
              />
              <div>
                <div className="text-base font-bold text-sky-800 leading-tight">SMK IT ALHAWARI</div>
                <div className="text-[11px] text-slate-500 -mt-0.5">Sistem Informasi Absensi & Akademik</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              {auth?.user ? (
                <Link href={route('dashboard')} className="px-4 py-2 rounded-md bg-sky-600 text-white shadow-sm hover:bg-sky-700">Dashboard</Link>
              ) : (
                <>
                  <Link href={route('login.siswa')} className="px-3 py-2 text-sky-700 hover:underline">Login Siswa</Link>
                  <Link href={route('login')} className="px-3 py-2 text-sky-700 hover:underline">Login</Link>
                  <Link href={route('register')} className="px-3 py-2 border border-sky-600 text-sky-600 rounded-md hover:bg-sky-50">Register</Link>
                  <Link href={route('login.orangtua')} className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">Login Orang Tua</Link>
                </>
              )}
            </nav>

            {/* Mobile menu */}
            <MobileMenu auth={auth} />
          </div>
        </header>

        {/* ===== Hero ===== */}
        <section aria-label="Bagian Hero" className="relative overflow-hidden" style={{ minHeight: '56vh' }}>
          {/* background */}
          <div
            aria-hidden
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url('${heroImage}')`,
              filter: `brightness(${brightness}) contrast(${contrast})`,
              transition: 'filter 280ms ease',
            }}
          />

          {/* overlay */}
          <div
            aria-hidden
            className="absolute inset-0 transition-all"
            style={{
              background: overlayDark
                ? `linear-gradient(rgba(2,6,23,${overlayOpacity}), rgba(2,6,23,${overlayOpacity * 0.85}))`
                : `linear-gradient(rgba(255,255,255,${overlayOpacity}), rgba(255,255,255,${overlayOpacity * 0.85}))`,
            }}
          />

          {/* dekorasi blob */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle at center, #38bdf8, transparent 60%)' }} />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle at center, #22c55e, transparent 60%)' }} />

          {/* Visual Controls Toggle */}
          <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
            <button
              onClick={() => setShowVisualControls((v) => !v)}
              aria-expanded={showVisualControls}
              aria-controls="visual-controls-panel"
              className="p-2 rounded-md bg-white/90 text-xs shadow-sm border hover:bg-white"
              title={showVisualControls ? 'Sembunyikan pengaturan visual' : 'Tampilkan pengaturan visual'}
            >
              {showVisualControls ? 'Sembunyikan ▴' : 'Pengaturan ▾'}
            </button>
          </div>

          {/* Panel visual controls */}
          <div
            id="visual-controls-panel"
            role="region"
            aria-label="Pengaturan visual"
            className={`absolute right-4 top-14 z-30 transition-all duration-200 ${showVisualControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            style={{ width: 320 }}
          >
            <div className="rounded-md bg-white/90 p-3 shadow-lg backdrop-blur-sm border" data-reveal>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium">Tampilan Latar</div>
                <button onClick={() => setShowVisualControls(false)} aria-label="Tutup pengaturan" className="text-xs px-2 py-1 rounded hover:bg-slate-100">Tutup</button>
              </div>

              <label className="flex items-center gap-2 text-xs mb-2">
                <input type="checkbox" checked={overlayDark} onChange={(e) => setOverlayDark(e.target.checked)} className="h-4 w-4 rounded accent-sky-600" />
                <span className="select-none">Dark overlay</span>
              </label>

              <RangeRow label="Opacity" value={overlayOpacity} min={0.15} max={0.9} step={0.01} onChange={setOverlayOpacity} format={(v) => `${Math.round(v * 100)}%`} />
              <RangeRow label="Brightness" value={brightness} min={0.6} max={1.6} step={0.01} onChange={setBrightness} />
              <RangeRow label="Contrast" value={contrast} min={0.7} max={1.6} step={0.01} onChange={setContrast} />

              <div className="flex justify-end gap-2">
                <button onClick={handleResetVisuals} className="px-2 py-1 rounded-md bg-slate-100 text-xs hover:bg-slate-200">Reset</button>
              </div>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6" data-reveal>
                <h1 className={`text-3xl sm:text-4xl font-extrabold ${overlayDark ? 'text-white' : 'text-slate-900'}`}>Absensi & Manajemen Sekolah — Mudah, Cepat, Akurat</h1>
                <p className={`${overlayDark ? 'text-white/90' : 'text-slate-700'}`}>Catat kehadiran siswa & guru, pantau statistik, ekspor laporan resmi — semuanya dalam satu tempat yang ramah pendidikan.</p>

                {/* CTA utama */}
                <div className="flex flex-wrap gap-3">
                  <Link href={route('login')} className={`inline-flex items-center gap-2 px-5 py-3 rounded-md shadow ${overlayDark ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-white text-sky-700 hover:bg-sky-50'}`}>Mulai Absen</Link>
                  <Link href={route('login.orangtua')} className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" aria-label="Login untuk Orang Tua">Login Orang Tua</Link>
                  <a href="#roles" className={`px-4 py-3 rounded-md ${overlayDark ? 'bg-white/10 text-white' : 'bg-white text-slate-800'} border ${overlayDark ? 'border-white/20' : 'border-slate-200'}`}>Pilih Peran</a>
                </div>

                {/* Stats ringkas */}
                <div className={`flex gap-6 ${overlayDark ? 'text-white/90' : 'text-slate-700'}`}>
                  <Stat label="Siswa Aktif" value={siswaCount.toLocaleString()} />
                  <Stat label="Guru Aktif" value={guruCount.toLocaleString()} />
                  <Stat label="Rata-rata Kehadiran" value={`${Number(rataCount).toFixed(1)}%`} />
                </div>
              </div>

              {/* Kartu ringkas + sparkline */}
              <div className={`${overlayDark ? 'bg-white/10 border-white/20' : 'bg-white border'} p-4 rounded-xl shadow-lg border`} data-reveal>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Tren Kehadiran Minggu Ini</div>
                    <div className="text-xl font-semibold text-sky-700 mt-1">Ringkasan</div>
                  </div>
                  <div className="text-xs text-slate-400">7 hari</div>
                </div>

                <Sparkline data={sparkData} />

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MiniStat bg="bg-sky-50" title="Hadir (total)" value="320" tone="text-sky-700" />
                  <MiniStat bg="bg-amber-50" title="Izin/Sakit" value="12" tone="text-amber-700" />
                </div>

                <div className="mt-4 text-xs text-slate-500">Klik <span className="font-medium">Mulai Absen</span> untuk menuju halaman login/absensi.</div>
              </div>
            </div>
          </div>

          {/* gradient fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: overlayDark ? 'linear-gradient(transparent, rgba(0,0,0,0.15))' : 'linear-gradient(transparent, rgba(255,255,255,0.9))' }} />
        </section>

        {/* ===== Peran Cepat (Role CTA) ===== */}
        <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-reveal>
            <RoleCard title="Siswa" desc="Absensi harian, lihat rekap pribadi." actionLabel="Login Siswa" href={route('login.siswa')} icon="student" />
            <RoleCard title="Guru" desc="Absensi guru & kelas yang diampu." actionLabel="Login" href={route('login')} icon="teacher" />
            <RoleCard title="Orang Tua" desc="Pantau kehadiran putra/putri." actionLabel="Login Orang Tua" href={route('login.orangtua')} icon="parent" />
            <RoleCard title="Admin Penilaian" desc="Kelola nilai & rapor." actionLabel="Masuk" href={route('login.penilaian')} icon="admin" />
          </div>
        </section>

        {/* ===== Fitur & Pengumuman ===== */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div data-reveal>
              <h3 className="text-xl font-semibold text-sky-800">Fitur Unggulan</h3>
              <p className="text-slate-600 mt-2">Dirancang untuk memudahkan administrasi dan monitoring kehadiran di sekolah.</p>

              <div className="mt-4 space-y-3">
                <FeatureCard title="Absensi Siswa" desc="Masuk/keluar, izin/sakit, rekap per kelas." />
                <FeatureCard title="Absensi Guru" desc="Rekap, cuti, integrasi jadwal mengajar." />
                <FeatureCard title="Jadwal & Jurnal" desc="Sinkron dengan pertemuan & materi." />
                <FeatureCard title="Laporan & Ekspor" desc="Ekspor PDF/Excel resmi, iCal." />
                <FeatureCard title="QR / Barcode" desc="Scan cepat, anti-antri." />
                <FeatureCard title="Notifikasi" desc="Kirim info ke orang tua secara terarah." />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between" data-reveal>
                <h3 className="text-xl font-semibold text-sky-800">Pengumuman Terbaru</h3>
                <div className="text-sm text-slate-500">Auto-rotate • Hover untuk pause</div>
              </div>

              <AnnouncementCarousel
                announcements={announcements}
                idx={idx}
                setIdx={setIdx}
                paused={carouselPaused}
                setPaused={setCarouselPaused}
                formatDateID={formatDateID}
              />

              <div className="grid grid-cols-2 gap-4" data-reveal>
                <QuickCard title="Kegiatan Guru" subtitle="Jadwal & rekap kehadiran" img="https://i.ytimg.com/vi/4wd3Lj3TjIM/maxresdefault.jpg" />
                <QuickCard title="Kelas & Siswa" subtitle="Daftar siswa & rekap per kelas" img="https://tse2.mm.bing.net/th/id/OIP.0FjyCGMriLPzX6unLYpIMQHaEK?pid=Api&P=0&h=180" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== Kepercayaan & Keamanan ===== */}
        <section className="bg-white/60 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-4" data-reveal>
            <TrustBadge title="Data Terenkripsi" desc="Standar keamanan modern." />
            <TrustBadge title="Audit Log Lengkap" desc="Setiap aksi tercatat rapi." />
            <TrustBadge title="Ekspor Resmi" desc="Format rapi untuk arsip sekolah." />
          </div>
        </section>

        {/* ===== FAQ Ringkas ===== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="main">
          <h3 className="text-xl font-semibold text-sky-800" data-reveal>FAQ</h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <FAQItem q="Apakah perlu instal aplikasi?" a="Tidak. Cukup akses via browser modern — sistem responsif dan ringan." />
            <FAQItem q="Bisa ekspor laporan?" a="Bisa. PDF & Excel tersedia, termasuk rekap per bulan & per pertemuan." />
            <FAQItem q="Peran yang didukung?" a="Siswa, Guru, Orang Tua/Wali, dan Admin Penilaian." />
            <FAQItem q="Apakah terintegrasi jadwal?" a="Ya. Jadwal & jurnal terhubung agar absensi per pertemuan konsisten." />
          </div>
        </section>

        {/* ===== CTA Bawah ===== */}
        <section className="bg-sky-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4" data-reveal>
            <div>
              <h4 className="text-lg font-semibold">Siap tingkatkan kedisiplinan kehadiran?</h4>
              <p className="text-sm text-sky-100/90">Gunakan antarmuka absensi berbasis web yang cepat untuk guru & staf.</p>
            </div>
            <div className="flex gap-3">
              <Link href={route('register')} className="rounded-md bg-white px-4 py-2 text-sky-700 font-semibold">Daftar Sekarang</Link>
              <Link href={route('login')} className="rounded-md border border-white/30 px-4 py-2">Masuk</Link>
              <Link href={route('login.orangtua')} className="rounded-md bg-emerald-500 px-4 py-2 text-white">Login Orang Tua</Link>
            </div>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500" data-reveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} SMK IT ALHAWARI — Sistem Absensi.</div>
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

/* ======================= Komponen Kecil ======================= */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function MobileMenu({ auth }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle menu" className="p-2 rounded-md border bg-white/90">
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 px-4 pb-4">
          <div className="space-y-2 bg-white rounded-md border shadow-sm p-2">
            {auth?.user ? (
              <Link href={route('dashboard')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Dashboard</Link>
            ) : (
              <>
                <Link href={route('login.siswa')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Login Siswa</Link>
                <Link href={route('login')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Login</Link>
                <Link href={route('register')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Register</Link>
                <Link href={route('login.orangtua')} className="block px-3 py-2 rounded-md bg-emerald-600 text-white text-center">Login Orang Tua</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RangeRow({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="flex items-center gap-2 text-xs mb-2">
      <label className="w-16">{label}</label>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 flex-1"
      />
      <div className="w-10 text-right text-[11px]">{format ? format(value) : value}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Sparkline({ data }) {
  const max = Math.max(...data);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 70},${20 - (v / max) * 18}`).join(' ');
  return (
    <div className="mt-3">
      <svg viewBox="0 0 70 20" className="w-full h-10" preserveAspectRatio="none" aria-hidden>
        <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points={points} />
        <polyline fill="rgba(14,165,233,0.08)" stroke="none" points={`0,20 ${points} 70,20`} />
      </svg>
    </div>
  );
}

function MiniStat({ bg, title, value, tone }) {
  return (
    <div className={`p-3 ${bg} rounded`}>
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="flex gap-3 items-start rounded-lg border p-3 bg-white shadow-sm">
      <div className="p-2 rounded bg-sky-50 text-sky-600" aria-hidden>
        {/* Ikon generik */}
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

function RoleCard({ title, desc, actionLabel, href, icon }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-sky-50 text-sky-700" aria-hidden>
          {icon === 'student' && (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" /><path d="M12 12v9" /><path d="M7 15l-5 2.5L12 22l10-4.5-5-2.5" /></svg>
          )}
          {icon === 'teacher' && (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M6 21v-2a6 6 0 0112 0v2" /></svg>
          )}
          {icon === 'parent' && (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-8 0v2" /><circle cx="12" cy="7" r="4" /></svg>
          )}
          {icon === 'admin' && (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          )}
        </div>
        <div>
          <div className="font-semibold text-slate-800">{title}</div>
          <div className="text-xs text-slate-500">{desc}</div>
        </div>
      </div>
      <div className="mt-4">
        <Link href={href} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-sm">{actionLabel}</Link>
      </div>
    </div>
  );
}

function AnnouncementCarousel({ announcements, idx, setIdx, paused, setPaused, formatDateID }) {
  const containerRef = useRef(null);

  // keyboard nav
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + announcements.length) % announcements.length);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % announcements.length);
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [announcements.length, setIdx]);

  const current = announcements[idx] ?? announcements[0];
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      tabIndex={0}
      className="bg-white rounded-lg p-4 shadow border focus:outline-none focus:ring-2 focus:ring-sky-400"
      role="region"
      aria-roledescription="carousel"
      aria-label="Pengumuman"
      data-reveal
    >
      <article className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-semibold text-sky-700">{current.title}</h4>
            <div className="text-xs text-slate-400">{formatDateID(current.date)}</div>
          </div>
          <div className="text-sm text-slate-600">#{current.id}</div>
        </div>

        <p className="text-sm text-slate-700">{current.body}</p>

        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setIdx((i) => (i - 1 + announcements.length) % announcements.length)} aria-label="Pengumuman sebelumnya" className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Prev</button>
          <button onClick={() => setIdx((i) => (i + 1) % announcements.length)} aria-label="Pengumuman berikutnya" className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Next</button>

          <div className="ml-auto flex items-center gap-2">
            {announcements.map((a, i) => (
              <button key={a.id} onClick={() => setIdx(i)} aria-label={`Tampilkan pengumuman ${i + 1}`} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-sky-600' : 'bg-slate-300'}`} />
            ))}
            <Link href={route('login')} className="ml-3 inline-flex items-center gap-2 px-3 py-1 bg-sky-600 text-white rounded">Login untuk detail</Link>
            <Link href={route('login.orangtua')} className="ml-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded">Login Orang Tua</Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function QuickCard({ title, subtitle, img }) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm flex gap-3 items-center border">
      <img
        src={img}
        alt={title}
        className="h-14 w-14 rounded object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'https://tse1.mm.bing.net/th/id/OIP.D00vtlc9GfNrCcZL28_R1gHaHa?pid=Api&P=0&h=180';
        }}
      />
      <div>
        <div className="font-medium text-sky-800">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

function TrustBadge({ title, desc }) {
  return (
    <div className="flex items-start gap-3 bg-white p-4 rounded-md border shadow-sm">
      <div className="p-2 rounded bg-emerald-50 text-emerald-600" aria-hidden>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-3.8 9.3-7 10-3.2-.7-7-5-7-10V6l7-4z" /></svg>
      </div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  return (
    <details className="bg-white rounded-md border p-4 shadow-sm" data-reveal>
      <summary className="cursor-pointer font-medium text-slate-800">{q}</summary>
      <p className="mt-2 text-sm text-slate-600">{a}</p>
    </details>
  );
}
