// resources/js/Pages/OrangTua/Profile/Show.jsx
import React, { useState, useRef, useEffect } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  X,
  Check,
  Trash2,
  ImageIcon,
  KeyRound,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  MessageCircle,
  Edit2,
  Phone,
  Copy,
  Shield,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CenterPopupNotice from '@/Components/CenterPopupNotice';

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-start py-2 border-b last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-800 break-words">
        {value || <span className="text-gray-400">-</span>}
      </dd>
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
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-sky-50 text-sky-600">{icon}</div>
          <div className="font-semibold text-gray-800">{title}</div>
        </div>
        <div className="text-slate-500">{open ? <ChevronUp /> : <ChevronDown />}</div>
      </button>
      {open && <div className="p-4 border-t text-sm text-gray-700">{children}</div>}
    </div>
  );
}

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

      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error('Gagal memproses gambar'));
          resolve(new File([blob], file.name, { type: blob.type }));
        },
        mime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat gambar'));
    };

    img.src = url;
  });

function hasRoute(name) {
  try {
    route(name);
    return true;
  } catch {
    return false;
  }
}

const pickFirstError = (errors) => {
  if (!errors) return null;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  const val = errors[firstKey];
  if (Array.isArray(val)) return val[0] ?? null;
  return val ?? null;
};

export default function ProfileShow({ auth, orangTua = {}, siswa = null, account = null }) {
  const { flash } = usePage().props;

  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(orangTua.foto_url || null);
  const [localFileInfo, setLocalFileInfo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [showPw3, setShowPw3] = useState(false);

  // penanda aksi terakhir (biar flash/error ditangani tepat sasaran)
  const [lastAction, setLastAction] = useState(null); // 'profile' | 'account' | 'password' | null

  // banner error khusus password (tanpa popup)
  const [pwBanner, setPwBanner] = useState(null);
  const [pwTouched, setPwTouched] = useState({
    current: false,
    password: false,
    confirm: false,
  });

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const [notice, setNotice] = useState({
    message: null,
    type: 'success',
    title: null,
  });

  const showNotice = (message, type = 'success', title = null) => {
    setNotice({ message: null, type, title });
    setTimeout(() => setNotice({ message, type, title }), 10);
  };

  // ✅ flash sukses/gagal global (tapi ERROR password ditangani pakai banner)
  useEffect(() => {
    if (flash?.success) {
      showNotice(flash.success, 'success', 'Berhasil');
    }

    if (flash?.error) {
      // kalau aksi terakhir password → jangan popup, tampilkan banner saja
      if (lastAction === 'password') {
        setPwBanner(flash.error);
      } else {
        showNotice(flash.error, 'error', 'Gagal');
      }
    }
  }, [flash, lastAction]);

  // update preview url kalau backend ngirim foto_url baru
  useEffect(() => {
    if (!orangTua?.foto_url) return;
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return orangTua.foto_url;
    });
    setLocalFileInfo(null);
  }, [orangTua?.foto_url]);

  const profileForm = useForm({
    nama_lengkap: orangTua.nama_lengkap || '',
    no_telepon_wa: orangTua.no_telepon_wa || '',
    pekerjaan: orangTua.pekerjaan || '',
    pendidikan_terakhir: orangTua.pendidikan_terakhir || '',
    file_foto: null,
  });

  const accountForm = useForm({
    username: account?.username ?? auth?.user?.username ?? '',
    email: account?.email ?? auth?.user?.email ?? '',
  });

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const canAccountRoute = hasRoute('orangtua.profile.account');
  const canPasswordRoute = hasRoute('orangtua.profile.password');

  // focus trap modal + disable scroll
  useEffect(() => {
    if (showEdit) {
      setTimeout(() => firstInputRef.current?.focus?.(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showEdit]);

  useEffect(() => {
    if (!showEdit) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowEdit(false);
      if (e.key === 'Tab') {
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
      toast.success('Nomor berhasil disalin.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin.');
    }
  };

  const openWhatsapp = (number) => {
    const n = number ? number.replace(/\D/g, '') : '';
    if (!n) return toast.error('Nomor belum tersedia.');
    window.open(`https://wa.me/${n}`, '_blank', 'noopener');
  };

  const clearSelectedFile = () => {
    profileForm.setData('file_foto', null);
    setLocalFileInfo(null);
    setUploadProgress(0);

    setPreviewUrl((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return orangTua.foto_url || null;
    });
  };

  const handleFileSelected = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotice('Format gambar tidak didukung (JPG/PNG/WEBP).', 'error', 'Gagal');
      return;
    }

    try {
      const resized = await resizeImageFile(file, 1024, 0.85);
      const finalFile = resized || file;

      profileForm.setData('file_foto', finalFile);

      const localUrl = URL.createObjectURL(finalFile);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return localUrl;
      });

      setLocalFileInfo({ name: finalFile.name, size: finalFile.size, type: finalFile.type });
    } catch (err) {
      console.error(err);
      showNotice('Gagal memproses gambar.', 'error', 'Gagal');
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelected(f);
  };

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

  const submitProfile = (e) => {
    e.preventDefault();
    setLastAction('profile');

    profileForm.post(route('orangtua.profile.update'), {
      preserveScroll: true,
      forceFormData: true,

      onProgress: (evt) => {
        if (!evt) return;
        if (evt.percentage != null) setUploadProgress(Math.round(evt.percentage));
      },

      onSuccess: () => {
        setShowEdit(false);
        profileForm.reset('file_foto');
        setLocalFileInfo(null);
        setUploadProgress(0);
        setLastAction(null);
      },

      onError: () => {
        setLastAction(null);
      },
    });
  };

  const submitAccount = (e) => {
    e.preventDefault();
    setLastAction('account');

    accountForm.put(route('orangtua.profile.account'), {
      preserveScroll: true,
      onSuccess: () => setLastAction(null),
      onError: () => setLastAction(null),
    });
  };

  // ====== PASSWORD LOGIC (tanpa popup saat gagal) ======
  const passMismatch =
    (passwordForm.data.password || passwordForm.data.password_confirmation) &&
    passwordForm.data.password !== passwordForm.data.password_confirmation;

  const submitPassword = (e) => {
    e.preventDefault();
    setLastAction('password');
    setPwBanner(null);

    // validasi cepat: kalau konfirmasi beda → stop, kasih tanda merah
    if (
      passwordForm.data.password &&
      passwordForm.data.password_confirmation &&
      passwordForm.data.password !== passwordForm.data.password_confirmation
    ) {
      setPwTouched((s) => ({ ...s, confirm: true, password: true }));
      setPwBanner('Konfirmasi password tidak cocok.');
      return;
    }

    passwordForm.put(route('orangtua.profile.password'), {
      preserveScroll: true,

      onError: (errors) => {
        // error validasi 422 (Inertia)
        setPwBanner(pickFirstError(errors) || 'Gagal mengubah password.');
      },

      onSuccess: () => {
        // sengaja kosong: sukses ditangani dari flash.success (useEffect global)
        // biar nggak tergantung page?.props
      },
    });
  };

  // kalau user lagi ngetik password → hilangkan banner (biar nggak nyangkut)
  useEffect(() => {
    if (!pwBanner) return;
    // kalau user mulai memperbaiki input, banner boleh hilang
    // tapi jangan terlalu agresif: cukup saat ada perubahan
  }, [passwordForm.data.current_password, passwordForm.data.password, passwordForm.data.password_confirmation]);

  // cleanup blob preview
  useEffect(() => {
    return () => {
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return prev;
      });
    };
  }, []);

  const fallbackOrtuAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    orangTua.nama_lengkap || 'Orang Tua'
  )}&background=0ea5e9&color=fff&size=256`;

  const fallbackSiswaAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    siswa?.nama_lengkap || 'Ananda'
  )}&background=10b981&color=fff&size=128`;

  // helper class input: merah kalau error/touched/mismatch
  const inputClass = (isInvalid = false) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      isInvalid
        ? 'border-rose-300 focus:ring-rose-300'
        : 'border-slate-200 focus:ring-sky-400'
    }`;

  return (
    <OrangTuaLayout user={auth.user} header="Profil Saya & Ananda">
      <Head title="Profil" />

      {/* Popup hanya untuk sukses / error non-password */}
      <CenterPopupNotice
        message={notice.message}
        type={notice.type}
        title={notice.title}
        duration={2300}
      />

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="mx-auto w-32 h-32 rounded-full overflow-hidden ring-4 ring-sky-50">
                  <img
                    src={previewUrl || fallbackOrtuAvatar}
                    alt={orangTua.nama_lengkap || 'Profil'}
                    className="w-full h-full object-cover"
                    onError={() => setPreviewUrl(null)}
                  />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                  {orangTua.nama_lengkap || 'Orang Tua'}
                </h2>
                <p className="text-sm text-gray-500">{orangTua.hubungan || 'Wali'}</p>

                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => setShowEdit(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-600 bg-sky-600 text-white hover:bg-sky-700"
                    type="button"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profil
                  </button>

                  <button
                    onClick={() => openWhatsapp(orangTua.no_telepon_wa)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-sky-600 hover:bg-sky-50"
                    type="button"
                  >
                    <MessageCircle className="w-4 h-4" /> WA
                  </button>
                </div>

                <div className="mt-4 flex justify-center items-center gap-3 text-sm text-gray-600">
                  <button
                    onClick={() => handleCopy(orangTua.no_telepon_wa)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-50"
                    type="button"
                  >
                    <Phone className="w-4 h-4 text-sky-600" />
                    {orangTua.no_telepon_wa || '-'}
                    <Copy className="w-4 h-4 text-gray-400 ml-1" />
                  </button>

                  <button
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
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-50 text-gray-600"
                    type="button"
                    title="Unduh vCard"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Siswa (Ananda) */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-emerald-50 bg-emerald-50 flex items-center justify-center">
                      <img
                        src={siswa?.foto_url || fallbackSiswaAvatar}
                        alt={siswa?.nama_lengkap || 'Ananda'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = fallbackSiswaAvatar;
                        }}
                      />
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Ananda</div>
                      <div className="font-semibold text-gray-800">
                        {siswa?.nama_lengkap || 'Belum Tersambung'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {siswa?.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : ''}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 text-sm text-gray-600 shadow-sm">
                <div className="font-medium text-gray-800 mb-2">Catatan</div>
                <p className="text-xs">
                  Sistem memakai route <b>/storage-public</b>. Jadi aman walau kamu belum <code>storage:link</code>.
                </p>
              </div>
            </div>

            {/* RIGHT */}
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
                      <Row
                        label="Kelas"
                        value={siswa.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : '-'}
                      />
                      <Row label="Jenis Kelamin" value={siswa.jenis_kelamin} />
                      <Row label="Agama" value={siswa.agama} />
                      <Row label="Alamat" value={siswa.alamat_lengkap} />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Data siswa belum tersedia.</p>
                  )}
                </CollapsibleCard>
              </div>

              {/* Manajemen Akun */}
              <CollapsibleCard title="Manajemen Akun" icon={<KeyRound />} defaultOpen>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Update Username/Email */}
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <AtSign className="w-4 h-4" /> Username / Email
                    </div>

                    <form onSubmit={submitAccount} className="mt-3 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">Username</label>
                        <input
                          value={accountForm.data.username}
                          onChange={(e) => accountForm.setData('username', e.target.value)}
                          className={inputClass(!!accountForm.errors.username)}
                          placeholder="username"
                        />
                        {accountForm.errors.username && (
                          <div className="mt-1 text-xs text-rose-600">{accountForm.errors.username}</div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Email (opsional)</label>
                        <input
                          value={accountForm.data.email}
                          onChange={(e) => accountForm.setData('email', e.target.value)}
                          className={inputClass(!!accountForm.errors.email)}
                          placeholder="email@contoh.com"
                        />
                        {accountForm.errors.email && (
                          <div className="mt-1 text-xs text-rose-600">{accountForm.errors.email}</div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!canAccountRoute || accountForm.processing}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                          !canAccountRoute || accountForm.processing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                        title={!canAccountRoute ? 'Route orangtua.profile.account belum ada' : 'Simpan akun'}
                      >
                        {accountForm.processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Simpan Akun
                      </button>
                    </form>
                  </div>

                  {/* Update Password */}
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <KeyRound className="w-4 h-4" /> Ubah Password
                    </div>

                    {/* Banner error khusus password (tanpa popup) */}
                    {pwBanner && (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {pwBanner}
                      </div>
                    )}

                    <form onSubmit={submitPassword} className="mt-3 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">Password Lama</label>
                        <div className="mt-1 relative">
                          <input
                            type={showPw1 ? 'text' : 'password'}
                            value={passwordForm.data.current_password}
                            onChange={(e) => {
                              setPwTouched((s) => ({ ...s, current: true }));
                              setPwBanner(null);
                              passwordForm.setData('current_password', e.target.value);
                            }}
                            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 ${
                              passwordForm.errors.current_password
                                ? 'border-rose-300 focus:ring-rose-300'
                                : 'border-slate-200 focus:ring-sky-400'
                            }`}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            onClick={() => setShowPw1((v) => !v)}
                          >
                            {showPw1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordForm.errors.current_password && (
                          <div className="mt-1 text-xs text-rose-600">{passwordForm.errors.current_password}</div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Password Baru</label>
                        <div className="mt-1 relative">
                          <input
                            type={showPw2 ? 'text' : 'password'}
                            value={passwordForm.data.password}
                            onChange={(e) => {
                              setPwTouched((s) => ({ ...s, password: true }));
                              setPwBanner(null);
                              passwordForm.setData('password', e.target.value);
                            }}
                            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 ${
                              passwordForm.errors.password || (pwTouched.password && passMismatch)
                                ? 'border-rose-300 focus:ring-rose-300'
                                : 'border-slate-200 focus:ring-sky-400'
                            }`}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            onClick={() => setShowPw2((v) => !v)}
                          >
                            {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordForm.errors.password && (
                          <div className="mt-1 text-xs text-rose-600">{passwordForm.errors.password}</div>
                        )}
                        <div className="mt-1 text-[11px] text-slate-500">
                          Minimal 8 karakter (atau sesuai pengaturan).
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Konfirmasi Password Baru</label>
                        <div className="mt-1 relative">
                          <input
                            type={showPw3 ? 'text' : 'password'}
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) => {
                              setPwTouched((s) => ({ ...s, confirm: true }));
                              setPwBanner(null);
                              passwordForm.setData('password_confirmation', e.target.value);
                            }}
                            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 ${
                              passwordForm.errors.password_confirmation || (pwTouched.confirm && passMismatch)
                                ? 'border-rose-300 focus:ring-rose-300'
                                : 'border-slate-200 focus:ring-sky-400'
                            }`}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            onClick={() => setShowPw3((v) => !v)}
                          >
                            {showPw3 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* error server */}
                        {passwordForm.errors.password_confirmation && (
                          <div className="mt-1 text-xs text-rose-600">
                            {passwordForm.errors.password_confirmation}
                          </div>
                        )}

                        {/* error client */}
                        {!passwordForm.errors.password_confirmation && pwTouched.confirm && passMismatch && (
                          <div className="mt-1 text-xs text-rose-600">Konfirmasi password tidak cocok.</div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!canPasswordRoute || passwordForm.processing}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                          !canPasswordRoute || passwordForm.processing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                        title={!canPasswordRoute ? 'Route orangtua.profile.password belum ada' : 'Ubah password'}
                        onClick={() => {
                          // tandai touched biar kalau kosong langsung merah setelah submit
                          setPwTouched({ current: true, password: true, confirm: true });
                        }}
                      >
                        {passwordForm.processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Ubah Password
                      </button>
                    </form>
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href={route('orangtua.dashboard')} className="text-sm text-sky-600 hover:underline">
              &larr; Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Edit Profil */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div ref={modalRef} className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Profil Orang Tua</h3>
              <button
                onClick={() => {
                  setShowEdit(false);
                  clearSelectedFile();
                }}
                type="button"
                className="text-gray-500 hover:text-gray-800"
                aria-label="Tutup"
              >
                <X />
              </button>
            </div>

            <form onSubmit={submitProfile} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input
                    ref={firstInputRef}
                    value={profileForm.data.nama_lengkap}
                    onChange={(e) => profileForm.setData('nama_lengkap', e.target.value)}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                      profileForm.errors.nama_lengkap ? 'border-rose-300' : 'border-slate-200'
                    }`}
                  />
                  {profileForm.errors.nama_lengkap && (
                    <div className="text-xs text-red-600 mt-1">{profileForm.errors.nama_lengkap}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">No. Telepon / WA</label>
                  <input
                    value={profileForm.data.no_telepon_wa}
                    onChange={(e) => profileForm.setData('no_telepon_wa', e.target.value)}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                      profileForm.errors.no_telepon_wa ? 'border-rose-300' : 'border-slate-200'
                    }`}
                  />
                  {profileForm.errors.no_telepon_wa && (
                    <div className="text-xs text-red-600 mt-1">{profileForm.errors.no_telepon_wa}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pekerjaan</label>
                  <input
                    value={profileForm.data.pekerjaan}
                    onChange={(e) => profileForm.setData('pekerjaan', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pendidikan Terakhir</label>
                  <input
                    value={profileForm.data.pendidikan_terakhir}
                    onChange={(e) => profileForm.setData('pendidikan_terakhir', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Foto Profil (opsional)</label>
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`mt-2 rounded-md border-dashed border-2 p-3 flex items-center gap-4 ${
                    dragActive ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-white'
                  }`}
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
                          <button
                            type="button"
                            onClick={clearSelectedFile}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
                          >
                            <Trash2 className="w-4 h-4" /> Hapus
                          </button>
                          <span className="text-xs text-gray-500">
                            {localFileInfo.name} • {(localFileInfo.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      Maks 5MB. Format: JPG, PNG, WEBP. Gambar diperkecil otomatis biar upload ngebut.
                    </p>

                    {profileForm.errors.file_foto && (
                      <div className="text-xs text-red-600 mt-1">{profileForm.errors.file_foto}</div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 bg-sky-600" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Mengunggah: {uploadProgress}%</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border"
                  onClick={() => {
                    setShowEdit(false);
                    clearSelectedFile();
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={profileForm.processing}
                  className="px-4 py-2 rounded-md bg-sky-600 text-white inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {profileForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OrangTuaLayout>
  );
}
