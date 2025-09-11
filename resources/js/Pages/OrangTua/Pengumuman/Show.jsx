import React, { useMemo } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, Link } from '@inertiajs/react';
import {
  Calendar,
  User,
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Tag,
  Bell,
  Clock
} from 'lucide-react';

/**
 * Halaman detail pengumuman — desain baru
 */
export default function PengumumanShow({ auth, pengumuman }) {
  // safe getters
  const pembuatNama = pengumuman?.pembuat?.nama_lengkap || 'Administrator';
  const targetLevel = pengumuman?.target_level || 'Semua';
  const tanggalTerbit = pengumuman?.tanggal_terbit || null;

  const daysAgo = useMemo(() => {
    if (!tanggalTerbit) return null;
    const d = new Date(tanggalTerbit);
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [tanggalTerbit]);

  const isNew = daysAgo !== null && daysAgo <= 7;

  const formattedDate = useMemo(() => {
    if (!tanggalTerbit) return '-';
    try {
      return new Date(tanggalTerbit).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return tanggalTerbit;
    }
  }, [tanggalTerbit]);

  // Print handler
  const handlePrint = (e) => {
    e.preventDefault();
    window.print();
  };

  // Share — simple navigator share if available, fallback copy URL
  const handleShare = async (e) => {
    e.preventDefault();
    const url = window.location.href;
    const title = pengumuman?.judul || 'Pengumuman';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // ignore
      }
      return;
    }
    // fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      alert('Link pengumuman disalin ke clipboard.');
    } catch {
      window.prompt('Salin link ini:', url);
    }
  };

  // Unduh lampiran bila ada (asumsi properti lampiran berupa array atau url)
  const attachments = pengumuman?.lampiran || []; // [] or array of {name, url}

  return (
    <OrangTuaLayout user={auth.user} header="Detail Pengumuman">
      <Head title={pengumuman.judul || 'Pengumuman'} />

      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Toolbar */}
          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href={route('orangtua.pengumuman.index')}
                className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-200 rounded"
                aria-label="Kembali ke daftar pengumuman"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Link>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 inline-flex items-center gap-2">
                <Tag className="w-4 h-4" /> {targetLevel}
              </div>
              {isNew && <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">BARU</div>}
            </div>

            <div className="flex items-center gap-2">
              {/* <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Cetak pengumuman"
                title="Cetak"
              >
                <Printer className="w-4 h-4" /> Cetak
              </button> */}

              {attachments.length > 0 && (
                <div className="relative">
                  <a
                    href={attachments[0].url || attachments[0]}
                    download
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Unduh lampiran"
                    title="Unduh lampiran"
                  >
                    <Download className="w-4 h-4" /> Unduh
                  </a>
                </div>
              )}

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Bagikan pengumuman"
                title="Bagikan"
              >
                <Share2 className="w-4 h-4" /> Bagikan
              </button>
            </div>
          </div>

          {/* Main content layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Content */}
            <article className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
              {/* Hero */}
              <div className="p-6 md:p-8">
                <header className="mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{pengumuman.judul}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Oleh: <span className="text-slate-700 font-medium">{pembuatNama}</span></span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={tanggalTerbit} className="text-slate-700">{formattedDate}</time>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-slate-500 text-xs">Terbit {daysAgo} hari lalu</span>
                    </div>
                  </div>
                </header>

                {/* Body */}
                <div className="prose prose-slate max-w-none mt-6">
                  <div dangerouslySetInnerHTML={{ __html: pengumuman.isi }} />
                </div>

                {/* Lampiran */}
                {attachments.length > 0 && (
                  <div className="mt-6 border-t pt-4 flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-slate-900">Lampiran</h4>
                    <ul className="space-y-2">
                      {attachments.map((att, i) => {
                        const name = att.name || `Lampiran-${i+1}`;
                        const url = att.url || att;
                        return (
                          <li key={i}>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sky-600 hover:underline">
                              <Download className="w-4 h-4" /> {name}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Ringkasan</h4>
                  <p className="text-sm text-slate-600">{pengumuman.judul}</p>
                  <dl className="mt-3 text-sm text-slate-500">
                    <div className="flex justify-between py-1">
                      <dt className="font-medium">Target</dt>
                      <dd>{targetLevel}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="font-medium">Status</dt>
                      <dd>{isNew ? 'Baru' : 'Terlama'}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="font-medium">Penulis</dt>
                      <dd>{pembuatNama}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Tindakan Cepat</h4>
                  <div className="flex flex-col gap-3">
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      aria-label="Aktifkan notifikasi untuk pengumuman ini"
                      onClick={() => alert('Fitur notifikasi belum di-setup.')}
                    >
                      <Bell className="w-4 h-4" /> Aktifkan Notifikasi
                    </button>

                    <Link
                      href={route('orangtua.pengumuman.index')}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-white border border-slate-200 hover:shadow-sm"
                      aria-label="Kembali ke daftar pengumuman"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Tips Membaca</h4>
                  <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
                    <li>Perhatikan tanggal & deadline terkait pengumuman.</li>
                    <li>Unduh lampiran jika tersedia.</li>
                    <li>Hubungi pihak sekolah bila ada pertanyaan.</li>
                  </ol>
                </div>
              </div>
            </aside>
          </div>

        </div>
      </div>
    </OrangTuaLayout>
  );
}
