// resources/js/Pages/OrangTua/ProfileShow.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  User,
  Shield,
  Edit2,
  Phone,
  Copy,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Download,
  X,
  Check,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-start py-2 border-b last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-800 break-words">{value || <span className="text-gray-400">-</span>}</dd>
    </div>
  );
}

function CollapsibleCard({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-sky-50 text-sky-600">{icon}</div>
          <div>
            <div className="font-semibold text-gray-800">{title}</div>
          </div>
        </div>
        <div className="text-slate-500">{open ? <ChevronUp /> : <ChevronDown />}</div>
      </button>
      {open && <div className="p-4 border-t text-sm text-gray-700">{children}</div>}
    </div>
  );
}

/**
 * Resize image client-side to maxWidth (preserve aspect ratio)
 * Returns a File object (webp/jpeg/png depending on original type)
 */
const resizeImageFile = (file, maxWidth = 1024, quality = 0.85) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.width / img.height;
      const targetWidth = img.width > maxWidth ? maxWidth : img.width;
      const targetHeight = Math.round(targetWidth / ratio);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      // choose output type based on original
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            URL.revokeObjectURL(url);
            return reject(new Error('Gagal memproses gambar'));
          }
          // Create a new file so Inertia can handle it as upload
          const newFile = new File([blob], file.name, { type: blob.type });
          URL.revokeObjectURL(url);
          resolve(newFile);
        },
        mime,
        quality
      );
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat gambar'));
    };
    img.src = url;
  });

export default function ProfileShow({ auth, orangTua = {}, siswa = null }) {
  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(orangTua.foto_url || null);
  const [localFileInfo, setLocalFileInfo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Inertia form (edit)
  const { data, setData, post, processing, errors, reset } = useForm({
    nama_lengkap: orangTua.nama_lengkap || '',
    no_telepon_wa: orangTua.no_telepon_wa || '',
    pekerjaan: orangTua.pekerjaan || '',
    pendidikan_terakhir: orangTua.pendidikan_terakhir || '',
    file_foto: null,
  });

  // open modal + focus management
  useEffect(() => {
    if (showEdit) {
      // set focus to first input slightly after render
      setTimeout(() => firstInputRef.current?.focus?.(), 80);
      // trap scroll on body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showEdit]);

  // ESC to close modal and basic focus trap
  useEffect(() => {
    if (!showEdit) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowEdit(false);
      if (e.key === 'Tab') {
        // focus trap
        const modal = modalRef.current;
        if (!modal) return;
        const focusables = modal.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEdit]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopied(true);
      toast.success('Nomor berhasil disalin ke clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast.error('Gagal menyalin. Silakan salin manual.');
    }
  };

  const openWhatsapp = (number) => {
    const n = number ? number.replace(/\D/g, '') : '';
    if (!n) {
      toast.error('Nomor belum tersedia.');
      return;
    }
    window.open(`https://wa.me/${n}`, '_blank', 'noopener');
  };

  const clearSelectedFile = () => {
    setData('file_foto', null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(orangTua.foto_url || null);
    setLocalFileInfo(null);
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    // basic validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format gambar tidak didukung. Gunakan JPG, PNG atau WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // attempt to resize if big, else reject
      // We'll still attempt to resize down below
    }

    try {
      // resize to max 1024px width to reduce upload
      const resized = await resizeImageFile(file, 1024, 0.85);
      // if resized returns null, fallback to original
      const finalFile = resized || file;
      setData('file_foto', finalFile);
      const localUrl = URL.createObjectURL(finalFile);
      // revoke previous blob if created
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(localUrl);
      setLocalFileInfo({ name: finalFile.name, size: finalFile.size, type: finalFile.type });
    } catch (err) {
      console.error('resize error', err);
      toast.error('Gagal memproses file gambar. Coba file lain.');
    }
  };

  // file input change
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelected(f);
  };

  // drag and drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileSelected(f);
  };

  // submit handler with upload progress
  const submit = (e) => {
    e.preventDefault();
    setUploadProgress(0);
    post(route('orangtua.profile.update'), {
      preserveScroll: true,
      onBefore: () => setUploadProgress(0),
      onProgress: (progress) => {
        if (progress && progress.percentage) setUploadProgress(Math.round(progress.percentage));
      },
      onSuccess: () => {
        setShowEdit(false);
        toast.success('Profil berhasil diperbarui.');
        setUploadProgress(0);
      },
      onError: () => {
        toast.error('Gagal menyimpan perubahan.');
        setUploadProgress(0);
      },
    });
  };

  // cleanup blob urls on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <OrangTuaLayout user={auth.user} header="Profil Saya & Ananda">
      <Head title="Profil" />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Avatar + quick actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="mx-auto w-32 h-32 rounded-full overflow-hidden ring-4 ring-sky-50">
                  <img
                    src={previewUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(orangTua.nama_lengkap || 'Orang Tua')}&background=0ea5e9&color=fff&size=256`}
                    alt={orangTua.nama_lengkap || 'Profil'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">{orangTua.nama_lengkap || 'Orang Tua'}</h2>
                <p className="text-sm text-gray-500">{orangTua.hubungan || 'Wali'}</p>

                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => setShowEdit(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-600 bg-sky-600 text-white hover:bg-sky-700 focus:outline-none"
                    aria-label="Edit Profil"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profil
                  </button>
                  <button
                    onClick={() => openWhatsapp(orangTua.no_telepon_wa)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-sky-600 hover:bg-sky-50 focus:outline-none"
                    aria-label="Hubungi via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" /> WA
                  </button>
                </div>

                <div className="mt-4 flex justify-center items-center gap-3 text-sm text-gray-600">
                  <button
                    onClick={() => handleCopy(orangTua.no_telepon_wa)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-50"
                    aria-label="Salin nomor"
                  >
                    <Phone className="w-4 h-4 text-sky-600" />
                    {orangTua.no_telepon_wa || '-'}
                    <Copy className="w-4 h-4 text-gray-400 ml-1" />
                  </button>

                  <button
                    onClick={() => {
                      // simple vcard download
                      const v = [
                        'BEGIN:VCARD',
                        'VERSION:3.0',
                        `FN:${orangTua.nama_lengkap || ''}`,
                        `TEL;TYPE=CELL:${orangTua.no_telepon_wa || ''}`,
                        'END:VCARD',
                      ].join('\n');
                      const blob = new Blob([v], { type: 'text/vcard' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${(orangTua.nama_lengkap || 'profile').replace(/\s+/g, '_')}.vcf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-50 text-gray-600"
                    aria-label="Unduh vCard"
                    title="Unduh vCard"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick summary siswa */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
                      <User />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Ananda</div>
                      <div className="font-semibold text-gray-800">{siswa?.nama_lengkap || 'Belum Tersambung'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{siswa ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : ''}</div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="p-2 bg-gray-50 rounded-md text-center">
                    <div className="font-semibold">-</div>
                    <div className="text-gray-400">Hadir (30d)</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md text-center">
                    <div className="font-semibold">-</div>
                    <div className="text-gray-400">Izin/Sakit</div>
                  </div>
                </div>
              </div>

              {/* small help */}
              <div className="bg-white rounded-lg p-4 text-sm text-gray-600 shadow-sm">
                <div className="font-medium text-gray-800 mb-2">Butuh Bantuan?</div>
                <p className="text-xs">Hubungi admin sekolah jika data siswa belum terhubung atau terjadi kesalahan data.</p>
              </div>
            </div>

            {/* RIGHT: Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CollapsibleCard title="Informasi Orang Tua" icon={<Shield />} defaultOpen>
                  <div className="space-y-2">
                    <Row label="Nama Lengkap" value={orangTua.nama_lengkap} />
                    <Row label="Hubungan" value={orangTua.hubungan} />
                    <Row label="NIK" value={orangTua.nik} />
                    <Row label="No. Telepon / WA" value={orangTua.no_telepon_wa} />
                    <Row label="Pekerjaan" value={orangTua.pekerjaan} />
                    <Row label="Pendidikan Terakhir" value={orangTua.pendidikan_terakhir} />
                  </div>
                </CollapsibleCard>

                <CollapsibleCard title="Informasi Ananda" icon={<User />} defaultOpen={false}>
                  {siswa ? (
                    <div className="space-y-2">
                      <Row label="Nama" value={siswa.nama_lengkap} />
                      <Row label="NIS / NISN" value={`${siswa.nis} / ${siswa.nisn}`} />
                      <Row label="Kelas" value={`${siswa.kelas.tingkat} ${siswa.kelas.jurusan}`} />
                      <Row label="Tempat, Tanggal Lahir" value={`${siswa.tempat_lahir}, ${new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID')}`} />
                      <Row label="Jenis Kelamin" value={siswa.jenis_kelamin} />
                      <Row label="Agama" value={siswa.agama} />
                      <Row label="Alamat" value={siswa.alamat_lengkap} />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Data siswa belum tersedia.</p>
                  )}
                </CollapsibleCard>
              </div>

              {/* Actions / history / additional info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-800">Aksi Cepat</h3>
                    <span className="text-xs text-gray-500">Shortcut</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                      onClick={() => setShowEdit(true)}
                    >
                      <Edit2 className="w-4 h-4" /> Edit Profil
                    </button>
                    <button
                      className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                      onClick={() => openWhatsapp(orangTua.no_telepon_wa)}
                    >
                      <MessageCircle className="w-4 h-4" /> Kirim Pesan WA
                    </button>
                    <button
                      className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                      onClick={() => {
                        const v = [
                          'BEGIN:VCARD',
                          'VERSION:3.0',
                          `FN:${orangTua.nama_lengkap || ''}`,
                          `TEL;TYPE=CELL:${orangTua.no_telepon_wa || ''}`,
                          'END:VCARD',
                        ].join('\n');
                        const blob = new Blob([v], { type: 'text/vcard' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(orangTua.nama_lengkap || 'profile').replace(/\s+/g, '_')}.vcf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="w-4 h-4" /> Unduh vCard
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-800">Privasi & Keamanan</h3>
                  <p className="text-xs text-gray-500 mt-2">Pastikan data pribadi disimpan dengan aman. Jika butuh perubahan sensitif, hubungi admin.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer small nav */}
          <div className="mt-6 text-center">
            <Link href={route('orangtua.dashboard')} className="text-sm text-sky-600 hover:underline">&larr; Kembali ke Dashboard</Link>
          </div>
        </div>
      </div>

      {/* Modal Edit */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div ref={modalRef} className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Profil Orang Tua</h3>
              <button onClick={() => { setShowEdit(false); clearSelectedFile(); }} aria-label="Tutup" className="text-gray-500 hover:text-gray-800"><X /></button>
            </div>

            <form onSubmit={submit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input ref={firstInputRef} value={data.nama_lengkap} onChange={(e) => setData('nama_lengkap', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                  {errors.nama_lengkap && <div className="text-xs text-red-600 mt-1">{errors.nama_lengkap}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">No. Telepon / WA</label>
                  <input value={data.no_telepon_wa} onChange={(e) => setData('no_telepon_wa', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                  {errors.no_telepon_wa && <div className="text-xs text-red-600 mt-1">{errors.no_telepon_wa}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pekerjaan</label>
                  <input value={data.pekerjaan} onChange={(e) => setData('pekerjaan', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pendidikan Terakhir</label>
                  <input value={data.pendidikan_terakhir} onChange={(e) => setData('pendidikan_terakhir', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                </div>
              </div>

              {/* File upload area */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Foto Profil (opsional)</label>
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`mt-2 rounded-md border-dashed border-2 p-3 flex items-center gap-4 ${dragActive ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center text-gray-300">
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-10 h-10" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Tarik & lepas gambar di sini, atau pilih dari perangkat.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="inline-flex items-center px-3 py-2 rounded-md border text-sm cursor-pointer bg-white hover:bg-gray-50">
                        Pilih Gambar
                        <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
                      </label>
                      {localFileInfo && (
                        <>
                          <button type="button" onClick={() => { clearSelectedFile(); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-gray-50">
                            <Trash2 className="w-4 h-4" /> Hapus
                          </button>
                          <span className="text-xs text-gray-500">{localFileInfo.name} • {(localFileInfo.size / 1024 / 1024).toFixed(2)} MB</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Maks 5MB. Format: JPG, PNG, WEBP. Gambar akan diperkecil otomatis untuk mempercepat upload.</p>
                    {errors.file_foto && <div className="text-xs text-red-600 mt-1" role="alert">{errors.file_foto}</div>}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-sky-600" style={{ width: `${uploadProgress}%` }} />
                        <div className="text-xs text-gray-500 mt-1">Mengunggah: {uploadProgress}%</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded-md border" onClick={() => { setShowEdit(false); clearSelectedFile(); reset(); }}>Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-sky-600 text-white inline-flex items-center gap-2">
                  <Check className="w-4 h-4" /> {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OrangTuaLayout>
  );
}
