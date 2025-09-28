// resources/js/Pages/Welcome.jsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';

/**
 * Landing page interaktif (update: control panel hide/show)
 */

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  const heroImage = 'https://png.pngtree.com/background/20230522/original/pngtree-3d-rendering-of-a-school-building-picture-image_2685696.jpg';

  const announcements = [
    { id: 1, title: 'Ujian Tengah Semester', date: '2025-09-10', body: 'UTS dimulai 10 September — persiapkan materi.' },
    { id: 2, title: 'Libur Nasional', date: '2025-09-21', body: 'Libur nasional — sekolah tutup.' },
    { id: 3, title: 'Rapat Orang Tua', date: '2025-10-02', body: 'Rapat wali murid untuk evaluasi pembelajaran.' },
  ];

  // statistik (contoh)
  const statsTarget = { siswaAktif: 420, guruAktif: 42, rataKehadiran: 92.3 };

  // counters
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
    let step = 0;
    const maxSteps = 14;
    const interval = setInterval(() => {
      step++;
      setSiswaCount(Math.round((statsTarget.siswaAktif * step) / maxSteps));
      setGuruCount(Math.round((statsTarget.guruAktif * step) / maxSteps));
      setRataCount(Number(((statsTarget.rataKehadiran * step) / maxSteps).toFixed(1)));
      if (step >= maxSteps) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // carousel
  const [idx, setIdx] = useState(0);
  const carouselRef = useRef(null);
  const [carouselPaused, setCarouselPaused] = useState(false);
  useEffect(() => {
    if (carouselPaused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % announcements.length), 4500);
    return () => clearInterval(t);
  }, [announcements.length, carouselPaused]);

  // visual controls
  const [overlayDark, setOverlayDark] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);

  // control panel visibility (new)
  const [showVisualControls, setShowVisualControls] = useState(false);

  // attempt to detect image luminance
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
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0,0,w,h).data;
        let total = 0;
        for (let i=0;i<data.length;i+=4){
          const r = data[i], g = data[i+1], b = data[i+2];
          total += 0.2126*r + 0.7152*g + 0.0722*b;
        }
        const avg = total / (data.length/4);
        setOverlayDark(avg > 140);
      } catch (e) {
        setOverlayDark(true);
      }
    };
    img.onerror = () => setOverlayDark(true);
  }, []);

  // small helper
  const formatDateID = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

  // sparkline sample
  const sparkData = [5,7,6,8,9,7,10];

  // Scroll reveal
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    nodes.forEach(n => {
      n.classList.add('reveal');
      observer.observe(n);
    });

    return () => observer.disconnect();
  }, []);

  const handleResetVisuals = () => {
    setBrightness(1);
    setContrast(1);
    setOverlayOpacity(0.55);
    setOverlayDark(true);
  };

  const handleImgError = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo-placeholder.jpg'; };

  // header mobile menu
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <>
      <Head title="Selamat Datang - Sistem Absensi" />
      <style>{`
        .reveal { opacity: 0; transform: translateY(14px) scale(0.995); transition: opacity 520ms cubic-bezier(.2,.9,.2,1), transform 520ms cubic-bezier(.2,.9,.2,1); will-change: transform,opacity; }
        .reveal-visible { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-visible { transition: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-sky-600 selection:text-white">
        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between" data-reveal>
          <div className="flex items-center gap-3">
            <img src="img/alhawari.png"
                 alt="Logo" className="h-11 w-11 rounded-md object-cover shadow-sm border"
                 onError={handleImgError} / >
            <div>
              <div className="text-lg font-bold text-sky-800">SMK IT ALHAWARI</div>
              <div className="text-xs text-slate-500">Sistem Informasi Absensi & Akademik</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-3">
            {auth?.user ? (
              <Link href={route('dashboard')} className="px-4 py-2 rounded-md bg-sky-600 text-white shadow-sm hover:bg-sky-700">Dashboard</Link>
            ) : (
              <>
                <Link href={route('login.siswa')} className="px-3 py-2 text-sky-700 hover:underline">Login Siswa</Link>
                <Link href={route('login')} className="px-3 py-2 text-sky-700 hover:underline">Login</Link>
                <Link href={route('register')} className="px-3 py-2 border border-sky-600 text-sky-600 rounded-md hover:bg-sky-50">Register</Link>
                <Link href={route('login.orangtua')} className="ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">Login Orang Tua</Link>
                <a href={route('login.penilaian')} className="btn">Login Admin Penilaian</a>

              </>
            )}
          </nav>

          {/* mobile menu toggle */}
          <div className="md:hidden">
            <button onClick={() => setOpenMenu(v => !v)} aria-expanded={openMenu} aria-label="Toggle menu" className="p-2 rounded-md border bg-white">
              {openMenu ? '✕' : '☰'}
            </button>
          </div>
        </header>

        {/* mobile nav */}
        {openMenu && (
          <div className="md:hidden px-4 pb-4" data-reveal>
            <div className="space-y-2">
              <Link href={route('login.siswa')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Login Siswa</Link>
              <Link href={route('login')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Login</Link>
              <Link href={route('register')} className="block px-3 py-2 rounded-md hover:bg-slate-100">Register</Link>
              <Link href={route('login.orangtua')} className="block px-3 py-2 rounded-md bg-emerald-600 text-white text-center">Login Orang Tua</Link>
            </div>
          </div>
        )}

        {/* HERO */}
        <section aria-label="Hero" className="relative overflow-hidden" style={{ minHeight: '52vh' }}>
          {/* background image container */}
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
            style={{
              background: overlayDark
                ? `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity * 0.85}))`
                : `linear-gradient(rgba(255,255,255,${overlayOpacity}), rgba(255,255,255,${overlayOpacity * 0.85}))`
            }}
            className="absolute inset-0 transition-all duration-300"
          />

          {/* Visual Controls Toggle Button (always small) */}
          <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
            {/* show/hide control button */}
            <button
              onClick={() => setShowVisualControls(v => !v)}
              aria-expanded={showVisualControls}
              aria-controls="visual-controls-panel"
              className="p-2 rounded-md bg-white/90 text-sm shadow-sm border hover:bg-white"
              title={showVisualControls ? 'Sembunyikan pengaturan visual' : 'Tampilkan pengaturan visual'}
            >
              {showVisualControls ? 'Hide ▴' : 'Show ▾'}
            </button>
          </div>

          {/* visual controls panel (collapsible). On small screens, keep compact. */}
          <div
            id="visual-controls-panel"
            role="region"
            aria-label="Visual controls"
            className={`absolute right-4 top-16 z-30 transition-all duration-200 ${showVisualControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            style={{ width: 320 }}
          >
            <div className="rounded-md bg-white/90 p-3 shadow-lg backdrop-blur-sm border" data-reveal>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium">Tampilan Latar</div>
                <button onClick={() => setShowVisualControls(false)} aria-label="Tutup pengaturan" className="text-xs px-2 py-1 rounded hover:bg-slate-100">Tutup</button>
              </div>

              <label className="flex items-center gap-2 text-xs mb-2">
                <input type="checkbox" checked={overlayDark} onChange={(e)=>setOverlayDark(e.target.checked)} className="h-4 w-4 rounded accent-sky-600" />
                <span className="select-none">Dark overlay</span>
              </label>

              <div className="flex items-center gap-2 text-xs mb-2">
                <label className="w-16">Opacity</label>
                <input aria-label="Overlay opacity" type="range" min="0.15" max="0.9" step="0.01" value={overlayOpacity} onChange={(e)=>setOverlayOpacity(parseFloat(e.target.value))} className="h-2 flex-1" />
                <div className="w-10 text-right text-xs">{Math.round(overlayOpacity*100)}%</div>
              </div>

              <div className="flex items-center gap-2 text-xs mb-2">
                <label className="w-16">Brightness</label>
                <input aria-label="Background brightness" type="range" min="0.6" max="1.6" step="0.01" value={brightness} onChange={(e)=>setBrightness(parseFloat(e.target.value))} className="h-2 flex-1" />
                <div className="w-10 text-right text-xs">{brightness}</div>
              </div>

              <div className="flex items-center gap-2 text-xs mb-3">
                <label className="w-16">Contrast</label>
                <input aria-label="Background contrast" type="range" min="0.7" max="1.6" step="0.01" value={contrast} onChange={(e)=>setContrast(parseFloat(e.target.value))} className="h-2 flex-1" />
                <div className="w-10 text-right text-xs">{contrast}</div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={handleResetVisuals} className="px-2 py-1 rounded-md bg-slate-100 text-xs hover:bg-slate-200">Reset</button>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6" data-reveal>
                <h1 className={`text-3xl sm:text-4xl font-extrabold ${overlayDark ? 'text-white' : 'text-slate-900'}`}>Absensi & Manajemen Sekolah — Mudah, Cepat, Akurat</h1>
                <p className={`${overlayDark ? 'text-white/90' : 'text-slate-700'}`}>Catat kehadiran siswa & guru, pantau statistik, ekspor laporan rapi — semua dalam satu tempat.</p>

                <div className="flex flex-wrap gap-3">
                  <Link href={route('login')} className={`inline-flex items-center gap-2 px-5 py-3 rounded-md shadow ${overlayDark ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-white text-sky-700 hover:bg-sky-50'}`}>Mulai Absen</Link>

                  <Link href={route('login.orangtua')} className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" aria-label="Login untuk Orang Tua">Login Orang Tua</Link>

                  <a href="#features" className={`px-4 py-3 rounded-md ${overlayDark ? 'bg-white/10 text-white' : 'bg-white text-slate-800'} border ${overlayDark ? 'border-white/20' : 'border-slate-200'}`}>Lihat Fitur</a>
                </div>

                <div className={`flex gap-6 ${overlayDark ? 'text-white/90' : 'text-slate-700'}`}>
                  <div>
                    <div className="text-xs">Siswa Aktif</div>
                    <div className="text-2xl font-bold">{siswaCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs">Guru Aktif</div>
                    <div className="text-2xl font-bold">{guruCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs">Rata-rata Kehadiran</div>
                    <div className="text-2xl font-bold">{Number(rataCount).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl shadow-lg ${overlayDark ? 'bg-white/6 border border-white/10' : 'bg-white border'}`} data-reveal>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Tren Kehadiran Minggu Ini</div>
                    <div className="text-xl font-semibold text-sky-700 mt-1">Ringkasan</div>
                  </div>
                  <div className="text-xs text-slate-400">7 hari</div>
                </div>

                <div className="mt-3">
                  <svg viewBox="0 0 70 20" className="w-full h-10" preserveAspectRatio="none" aria-hidden>
                    <polyline
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2"
                      points={sparkData.map((v,i)=> `${(i/(sparkData.length-1))*70},${20 - (v/Math.max(...sparkData))*18}`).join(' ')}
                    />
                    <polyline
                      fill="rgba(14,165,233,0.08)"
                      stroke="none"
                      points={`0,20 ${sparkData.map((v,i)=> `${(i/(sparkData.length-1))*70},${20 - (v/Math.max(...sparkData))*18}`).join(' ')} 70,20`}
                    />
                  </svg>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-sky-50 rounded">
                    <div className="text-xs text-slate-500">Hadir (total)</div>
                    <div className="text-lg font-bold text-sky-700">320</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded">
                    <div className="text-xs text-slate-500">Izin/Sakit</div>
                    <div className="text-lg font-bold text-amber-700">12</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">Klik <span className="font-medium">Mulai Absen</span> untuk menuju halaman login/absensi.</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: overlayDark ? 'linear-gradient(transparent, rgba(0,0,0,0.15))' : 'linear-gradient(transparent, rgba(255,255,255,0.9))' }} />
        </section>

        {/* FEATURES & ANNOUNCEMENTS */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div data-reveal>
              <h3 className="text-xl font-semibold text-sky-800">Fitur Unggulan</h3>
              <p className="text-slate-600 mt-2">Dirancang untuk memudahkan administrasi dan monitoring kehadiran di sekolah.</p>

              <div className="mt-4 space-y-3">
                <FeatureCard title="Absensi Siswa" desc="Masuk/keluar, izin/sakit, rekap per kelas." />
                <FeatureCard title="Absensi Guru" desc="Rekap, cuti, serta integrasi jadwal." />
                <FeatureCard title="Laporan & Ekspor" desc="Eksport PDF/Excel & iCal." />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between" data-reveal>
                <h3 className="text-xl font-semibold text-sky-800">Pengumuman Terbaru</h3>
                <div className="text-sm text-slate-500">Auto-rotate • Hover untuk pause</div>
              </div>

              <div ref={carouselRef} onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)} className="bg-white rounded-lg p-4 shadow" role="region" aria-roledescription="carousel" aria-label="Pengumuman" data-reveal>
                <article className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-sky-700">{announcements[idx].title}</h4>
                      <div className="text-xs text-slate-400">{formatDateID(announcements[idx].date)}</div>
                    </div>
                    <div className="text-sm text-slate-600">#{announcements[idx].id}</div>
                  </div>

                  <p className="text-sm text-slate-700">{announcements[idx].body}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => setIdx(i => (i - 1 + announcements.length) % announcements.length)} aria-label="Previous announcement" className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Prev</button>
                    <button onClick={() => setIdx(i => (i + 1) % announcements.length)} aria-label="Next announcement" className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Next</button>

                    <div className="ml-auto flex items-center gap-2">
                      {announcements.map((a, i) => (
                        <button key={a.id} onClick={() => setIdx(i)} aria-label={`Show announcement ${i+1}`} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-sky-600' : 'bg-slate-300'}`} />
                      ))}
                      <Link href={route('login')} className="ml-3 inline-flex items-center gap-2 px-3 py-1 bg-sky-600 text-white rounded">Login untuk detail</Link>
                      <Link href={route('login.orangtua')} className="ml-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded">Login Orang Tua</Link>
                    </div>
                  </div>
                </article>
              </div>

              <div className="grid grid-cols-2 gap-4" data-reveal>
                <QuickCard title="Kegiatan Guru" subtitle="Jadwal & rekap kehadiran" img="/images/teacher.jpg" />
                <QuickCard title="Kelas & Siswa" subtitle="Daftar siswa & rekap per kelas" img="/images/classroom.jpg" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
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

        {/* footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500" data-reveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>&copy; {new Date().getFullYear()} SMK IT ALHAWARI — Sistem Absensi.</div>
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

/* ---------- small components ---------- */
function FeatureCard({ title, desc }) {
  return (
    <div className="flex gap-3 items-start rounded-lg border p-3 bg-white shadow-sm">
      <div className="p-2 rounded bg-sky-50 text-sky-600">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" /></svg>
      </div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

function QuickCard({ title, subtitle, img }) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm flex gap-3 items-center">
      <img src={img} alt={title} className="h-14 w-14 rounded object-cover" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/images/placeholder.png'; }} />
      <div>
        <div className="font-medium text-sky-800">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}
