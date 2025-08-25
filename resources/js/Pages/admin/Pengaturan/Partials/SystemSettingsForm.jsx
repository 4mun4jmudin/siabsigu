import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import ToggleSwitch from '@/Components/ToggleSwitch';
import { Info, Bell, Mail, Server, Database, RefreshCw, Cog, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SystemSettingsForm({ className = '', pengaturan = {} }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        app_version: pengaturan.app_version || 'v1.0.0',
        database_version: pengaturan.database_version || 'MySQL 8.0',
        server_os: pengaturan.server_os || 'Next.js 14',
        last_update: pengaturan.last_update || '30 Juli 2024',
        database_status: pengaturan.database_status || 'Online',
        uptime: pengaturan.uptime || '7 hari 12 jam',
        notification_email_enabled: !!pengaturan.notification_email_enabled,
        email_administrator: pengaturan.email_administrator || '',
        smtp_server: pengaturan.smtp_server || '',
    });

    const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.pengaturan.clear-cache'), {
            preserveScroll: true,
            onSuccess: () => setToast({ type: 'success', message: 'Pengaturan Sistem berhasil diperbarui.' }),
            onError: () => setToast({ type: 'error', message: 'Gagal memperbarui pengaturan sistem. Cek input dan coba lagi.' }),
        });
    };
    

    const confirmAndCall = async (title, routeName) => {
        if (!confirm(`Yakin ingin ${title}? Operasi ini mungkin mempengaruhi kinerja sistem.`)) return;

        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const res = await fetch(route(routeName), {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf || '',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}), // kosong, tapi body agar beberapa server tidak menolak
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'Response not JSON' }));
                setToast({ type: 'error', message: err.message || 'Terjadi error saat menjalankan operasi.' });
                return;
            }

            const payload = await res.json();
            if (payload.success) {
                setToast({ type: 'success', message: payload.message || `${title} berhasil.` });
            } else {
                setToast({ type: 'error', message: payload.message || `${title} gagal.` });
            }
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: `${title} gagal. Cek log server.` });
        }
    };

    return (
        <section className={"max-w-5xl mx-auto p-4 " + className}>
            <header className="mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-600" /> Pengaturan Sistem
                </h2>
                <p className="mt-1 text-sm text-gray-600">Detail sistem, notifikasi, dan alat pemeliharaan.</p>
            </header>

            {/* Toast Notification */}
            {toast && (
                <div className={`mt-4 mb-4 p-3 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`} role="status">
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* Informasi Sistem */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-indigo-50 p-2 text-indigo-600"><Server className="w-5 h-5" /></div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Informasi Sistem</h3>
                                <p className="text-sm text-gray-500">Ringkasan singkat status dan versi sistem.</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">Terakhir sinkron: <span className="font-medium text-gray-700">{data.last_update}</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-gray-600 text-sm">Versi Aplikasi</p>
                            <p className="font-semibold text-gray-900">{data.app_version}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Versi Database</p>
                            <p className="font-semibold text-gray-900">{data.database_version}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Server / OS</p>
                            <p className="font-semibold text-gray-900">{data.server_os}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Status Database</p>
                            <p className={`font-semibold ${data.database_status === 'Online' ? 'text-green-500' : 'text-red-500'}`}>{data.database_status}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Uptime</p>
                            <p className="font-semibold text-gray-900">{data.uptime}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Terakhir Update</p>
                            <p className="font-semibold text-gray-900">{data.last_update}</p>
                        </div>
                    </div>
                </div>

                {/* Notifikasi */}
                <div className="bg-white shadow rounded-lg p-6 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-amber-50 p-2 text-amber-600"><Bell className="w-5 h-5" /></div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Notifikasi</h3>
                                <p className="text-sm text-gray-500">Pengaturan notifikasi sistem</p>
                            </div>
                        </div>

                        {/* big toggle -- mimic screenshot with larger switch */}
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline text-sm text-gray-500">Aktifkan Notifikasi</span>
                            <div>
                                <ToggleSwitch
                                    name="notification_email_enabled"
                                    checked={data.notification_email_enabled}
                                    onChange={(e) => setData('notification_email_enabled', e.target.checked)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-6">
                        <p className="text-sm font-medium text-gray-700">Notifikasi Email</p>
                        <p className="text-sm text-gray-500">Kirim notifikasi melalui email</p>

                        {data.notification_email_enabled ? (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="email_administrator" value="Email Administrator" />
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400"><Mail className="w-4 h-4" /></div>
                                        <TextInput
                                            id="email_administrator"
                                            type="email"
                                            className="mt-1 block w-full pl-10"
                                            value={data.email_administrator}
                                            onChange={(e) => setData('email_administrator', e.target.value)}
                                        />
                                    </div>
                                    <InputError message={errors.email_administrator} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="smtp_server" value="Server SMTP" />
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400"><Database className="w-4 h-4" /></div>
                                        <TextInput
                                            id="smtp_server"
                                            type="text"
                                            className="mt-1 block w-full pl-10"
                                            value={data.smtp_server}
                                            onChange={(e) => setData('smtp_server', e.target.value)}
                                        />
                                    </div>
                                    <InputError message={errors.smtp_server} className="mt-2" />
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 text-sm text-gray-500">Notifikasi email dinonaktifkan. Aktifkan untuk melihat pengaturan email.</div>
                        )}
                    </div>
                </div>

                {/* Pemeliharaan Sistem */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-sky-50 p-2 text-sky-600"><Cog className="w-5 h-5" /></div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Pemeliharaan Sistem</h3>
                                <p className="text-sm text-gray-500">Tools untuk pemeliharaan dan optimasi sistem</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => confirmAndCall('Clear Cache', 'admin.maintenance.clear-cache')}
                            className="w-full p-6 border rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center gap-3"
                        >
                            <RefreshCw className="w-6 h-6 text-gray-600" />
                            <div className="text-sm font-medium text-gray-800">Clear Cache</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => confirmAndCall('Optimize Database', 'admin.maintenance.optimize-database')}
                            className="w-full p-6 border rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center gap-3"
                        >
                            <Database className="w-6 h-6 text-gray-600" />
                            <div className="text-sm font-medium text-gray-800">Optimize Database</div>
                        </button>
                    </div>

                    <div className="mt-6 bg-amber-50 border border-amber-100 rounded-md p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-amber-600"><AlertTriangle className="w-5 h-5" /></div>
                            <div>
                                <p className="font-medium text-amber-800">Peringatan</p>
                                <p className="text-sm text-amber-700">Operasi pemeliharaan dapat mempengaruhi kinerja sistem. Lakukan saat jam tidak sibuk.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Simpan Pengaturan</PrimaryButton>
                    {recentlySuccessful && (
                        <p className="text-sm text-gray-600">Tersimpan.</p>
                    )}
                </div>
            </form>
        </section>
    );
}