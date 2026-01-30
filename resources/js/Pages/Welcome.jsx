import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';

/**
 * Modern Landing Page - Sistem Absensi Sekolah (SISAB)
 * Redesigned for better UX, readability, and performance.
 */

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  // --- Logic Statistik (Tetap dipertahankan karena fitur bagus) ---
  const statsTarget = useMemo(() => ({ siswaAktif: 420, guruAktif: 42, rataKehadiran: 92.3 }), []);
  const [counts, setCounts] = useState({ siswa: 0, guru: 0, rata: 0 });

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      setCounts({
        siswa: Math.round(statsTarget.siswaAktif * ease),
        guru: Math.round(statsTarget.guruAktif * ease),
        rata: Number((statsTarget.rataKehadiran * ease).toFixed(1))
      });

      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [statsTarget]);

  // --- Background Carousel Logic ---
  const backgroundImages = [
    'https://www.idisionline.com/wp-content/uploads/2025/09/IMG_20250926_183716.jpg', // Gambar Baru
    'https://png.pngtree.com/background/20230522/original/pngtree-3d-rendering-of-a-school-building-picture-image_2685696.jpg', // Gambar Lama (3D)
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop' // Gambar Placeholder (Sekolah)
  ];
  
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Ganti setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // --- Scroll Header Logic ---
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <Head title="Selamat Datang - Sistem Absensi Digital" />
      
      <div className="min-h-screen bg-slate-50 font-sans text-slate-600 selection:bg-indigo-500 selection:text-white">
        
        {/* === NAVBAR === */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className={`leading-tight transition-colors ${scrolled ? 'text-slate-800' : 'text-slate-800 lg:text-white'}`}>
                <h1 className="font-bold text-lg tracking-tight">SISAB</h1>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">SMK IT ALHAWARI</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
               {auth?.user ? (
                 <Link href={route('dashboard')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
                   Dashboard
                 </Link>
               ) : (
                 <>
                   <Link href={route('login')} className={`text-sm font-medium hover:underline ${scrolled ? 'text-slate-600' : 'text-slate-200'}`}>
                     Staff Login
                   </Link>
                   <Link href={route('login.siswa')} className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-indigo-50">
                     Area Siswa
                   </Link>
                   <Link href={route('login.orangtua')} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5">
                     Orang Tua
                   </Link>
                 </>
               )}
            </div>

             {/* Mobile Menu Button (Simple) */}
             <div className="md:hidden">
                <Link href={route('login')} className="p-2 text-indigo-600 font-bold bg-white rounded-md shadow-sm">
                  Masuk
                </Link>
             </div>
          </div>
        </nav>

        {/* === HERO SECTION === */}
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
          {/* Background Image Carousel & Overlay */}
          <div className="absolute inset-0 z-0">
            {backgroundImages.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentBgIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img 
                  src={img} 
                  alt={`School Background ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback jika gambar error
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop';
                  }}
                />
              </div>
            ))}
            
            {/* Gradient Overlay yang elegan dan pasti terbaca */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-indigo-900/40 z-10"></div>
          </div>

          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 text-xs font-medium backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sistem Akademik Terintegrasi v2.0
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                  Wujudkan Disiplin <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                    {/* IMPLEMENTASI TYPING ANIMATION */}
                    <Typewriter 
                      words={['Generasi Emas', 'Masa Depan', 'Prestasi Juara']} 
                      speed={100} 
                      deleteSpeed={50} 
                      delay={2000} 
                    />
                  </span>
                </h1>
                
                <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                  Platform manajemen kehadiran sekolah yang modern, real-time, dan mudah diakses oleh Siswa, Guru, dan Orang Tua.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href={route('login.siswa')} className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xl shadow-indigo-900/20 transition-all w-full sm:w-auto">
                    <span>Absen Sekarang</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                  <Link href="#fitur" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-medium backdrop-blur-sm transition-all w-full sm:w-auto">
                    Pelajari Fitur
                  </Link>
                </div>

                {/* Quick Stats in Hero */}
                <div className="pt-8 border-t border-white/10 flex gap-8 lg:gap-12">
                  <HeroStat label="Siswa Aktif" value={counts.siswa} />
                  <HeroStat label="Guru & Staff" value={counts.guru} />
                  <HeroStat label="Kehadiran" value={counts.rata + '%'} />
                </div>
              </div>

              {/* Right Content: Floating Cards (Glassmorphism) */}
              <div className="hidden lg:block relative">
                 {/* Decorative Blobs */}
                 <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                 <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                 <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-semibold text-lg">Pengumuman Terbaru</h3>
                      <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">Live Update</span>
                    </div>
                    
                    <div className="space-y-4">
                      <AnnouncementCard 
                        date="10 Sep" 
                        title="Ujian Tengah Semester" 
                        desc="Persiapkan diri anda, jadwal telah terbit di dashboard."
                        color="bg-amber-500"
                      />
                       <AnnouncementCard 
                        date="21 Sep" 
                        title="Libur Nasional" 
                        desc="Sekolah diliburkan memperingati hari besar."
                        color="bg-rose-500"
                      />
                       <AnnouncementCard 
                        date="02 Okt" 
                        title="Rapat Wali Murid" 
                        desc="Undangan evaluasi pembelajaran semester ganjil."
                        color="bg-emerald-500"
                      />
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                       <Link href={route('login')} className="text-sm text-indigo-300 hover:text-white transition-colors">Lihat semua pengumuman &rarr;</Link>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* === PORTAL AKSES CARD === */}
        <div className="relative -mt-16 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-4 gap-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
              <AccessCard 
                href={route('login.siswa')} 
                title="Siswa" 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                desc="Cek kehadiran & jadwal"
                color="text-indigo-600 bg-indigo-50"
              />
              <AccessCard 
                href={route('login')} 
                title="Guru / Staff" 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                desc="Input absen & jurnal"
                color="text-sky-600 bg-sky-50"
              />
              <AccessCard 
                href={route('login.orangtua')} 
                title="Orang Tua" 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                desc="Pantau putra/putri"
                color="text-emerald-600 bg-emerald-50"
              />
               <AccessCard 
                href={route('login')} 
                title="Admin" 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                desc="Pengaturan sistem"
                color="text-slate-600 bg-slate-100"
              />
           </div>
        </div>

        {/* === FITUR SECTION === */}
        <section id="fitur" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Teknologi untuk Kemudahan</h2>
              <p className="mt-4 text-lg text-slate-500">Kami mengintegrasikan proses administrasi manual menjadi digital, otomatis, dan akurat.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                title="Real-time Monitoring"
                desc="Data kehadiran masuk ke server secara instan. Wali kelas dan orang tua dapat melihat status kehadiran detik itu juga."
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              />
              <FeatureCard 
                title="Laporan Otomatis"
                desc="Tidak perlu rekap manual. Sistem menghasilkan laporan harian, bulanan, dan semester dalam format PDF/Excel."
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              />
              <FeatureCard 
                title="Notifikasi WhatsApp"
                desc="Orang tua menerima notifikasi otomatis jika anak tidak hadir tanpa keterangan atau terlambat."
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
              />
            </div>
          </div>
        </section>

        {/* === CTA SECTION === */}
        <section className="bg-slate-900 py-16 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
             <h2 className="text-3xl font-bold text-white mb-6">Siap untuk Transformasi Digital?</h2>
             <p className="text-slate-400 mb-8 text-lg">Bergabunglah dengan ekosistem pendidikan modern SMK IT Alhawari.</p>
             <div className="flex justify-center gap-4">
                <Link href={route('register')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg transition-transform transform hover:scale-105">
                  Daftarkan Akun Baru
                </Link>
             </div>
           </div>
        </section>

        {/* === FOOTER === */}
        <footer className="bg-slate-50 border-t border-slate-200 py-12 text-sm text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="font-bold text-slate-700 text-lg">SISAB</span>
               <span className="hidden md:inline">|</span>
               <span>&copy; {new Date().getFullYear()} SMK IT ALHAWARI</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-indigo-600">Kebijakan Privasi</a>
              <a href="#" className="hover:text-indigo-600">Bantuan</a>
              <a href="#" className="hover:text-indigo-600">Kontak</a>
            </div>
            <div className="text-xs text-slate-400">
               Laravel v{laravelVersion} (PHP v{phpVersion})
            </div>
          </div>
        </footer>

      </div>
      
      {/* Styles for simple animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </>
  );
}

// --- Sub Components untuk kebersihan kode ---

// Komponen Typing Animation
function Typewriter({ words, speed = 150, deleteSpeed = 100, delay = 1500 }) {
  const [index, setIndex] = useState(0); // Index kata dalam array words
  const [subIndex, setSubIndex] = useState(0); // Index karakter yang sedang diketik
  const [reverse, setReverse] = useState(false); // Mode menghapus
  const [blink, setBlink] = useState(true); // Kursos kedip

  // Efek kedip kursor
  useEffect(() => {
    const timeout2 = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout2);
  }, []);

  // Logika mengetik
  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      // Selesai mengetik satu kata, tunggu delay sebelum menghapus
      setTimeout(() => setReverse(true), delay);
      return;
    }

    if (subIndex === 0 && reverse) {
      // Selesai menghapus, pindah ke kata berikutnya
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, speed, deleteSpeed, delay]);

  return (
    <>
      {`${words[index].substring(0, subIndex)}`}
      <span className={`${blink ? 'opacity-100' : 'opacity-0'} ml-1 text-white`}>|</span>
    </>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="text-white">
      <div className="text-3xl lg:text-4xl font-bold tracking-tight">{value}</div>
      <div className="text-indigo-200 text-sm font-medium uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function AnnouncementCard({ date, title, desc, color }) {
  return (
    <div className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer">
       <div className={`shrink-0 w-12 h-12 ${color} rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg`}>
          <span className="text-xs opacity-80 uppercase">{date.split(' ')[1]}</span>
          <span className="text-lg leading-none">{date.split(' ')[0]}</span>
       </div>
       <div>
          <h4 className="text-white font-medium group-hover:text-indigo-300 transition-colors">{title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}

function AccessCard({ href, title, desc, icon, color }) {
  return (
    <Link href={href} className="group relative p-6 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all text-left">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} transition-transform group-hover:scale-110 duration-300`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 mt-2">{desc}</p>
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 text-slate-400">
        &rarr;
      </div>
    </Link>
  );
}

function FeatureCard({ title, desc, icon }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg border border-slate-100">
      <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mb-6">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}