import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import SiswaForm from "./Partials/SiswaForm";

export default function Create({ auth, kelasOptions = [] }) {
    const { props } = usePage();
    const flash = props?.flash || {};

    const form = useForm({
        id_siswa: "",
        nis: "",
        nisn: "",
        id_kelas: "",
        nama_lengkap: "",
        nama_panggilan: "",
        foto_profil: null,
        nik: "",
        nomor_kk: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        jenis_kelamin: "Laki-laki",
        agama: "Islam",
        alamat_lengkap: "",
        status: "Aktif",
        sidik_jari_template: "",
        barcode_id: "",
    });

    const { data, setData, post, processing, errors, reset, clearErrors } = form;

    const [clientError, setClientError] = useState(null);

    // panel notif sederhana (karena toast kamu bilang skip dulu)
    const notice = useMemo(() => {
        // dukung flash.success / flash.error / flash.message (biar gak rewel)
        if (flash?.error) return { type: "error", text: flash.error };
        if (flash?.success) return { type: "success", text: flash.success };
        if (flash?.message) return { type: "success", text: flash.message };
        return null;
    }, [flash]);

    useEffect(() => {
        // kalau ada error validasi, matiin error client
        if (Object.keys(errors || {}).length) setClientError(null);
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setClientError(null);
        clearErrors();

        // Validasi client minimal biar gak “hening”
        const required = ["id_siswa", "nis", "nisn", "id_kelas", "nama_lengkap", "nik", "nomor_kk", "tempat_lahir", "tanggal_lahir", "alamat_lengkap"];
        const missing = required.filter((k) => !String(data[k] ?? "").trim());

        if (missing.length) {
            setClientError(`Field wajib masih kosong: ${missing.join(", ")}`);
            return;
        }

        post(route("admin.siswa.store"), {
            forceFormData: true, // ✅ penting untuk upload file
            preserveScroll: true,
            onSuccess: () => {
                // tetap di halaman create, form dibersihkan
                reset();
                setFormKey((k) => k + 1); // reset preview/file state di SiswaForm
            },
            onError: (errs) => {
                // biar kalau gagal, keliatan minimal di console
                console.error("STORE SISWA ERROR:", errs);
                setClientError("Gagal menyimpan. Cek error validasi di bawah atau lihat Network/laravel.log.");
            },
        });
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Siswa">
            <Head title="Tambah Siswa" />

            {/* Notice sederhana */}
            {notice && (
                <div
                    className={`mb-4 rounded-lg px-4 py-3 text-sm border ${notice.type === "error"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                >
                    {notice.text}
                </div>
            )}

            {clientError && (
                <div className="mb-4 rounded-lg px-4 py-3 text-sm border bg-amber-50 border-amber-200 text-amber-800">
                    {clientError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                        Formulir Data Siswa Baru
                    </h2>

                    <SiswaForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        kelasOptions={kelasOptions}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                        disabled={processing}
                    >
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>

                    <Link
                        href={route("admin.siswa.index")}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold text-xs uppercase hover:bg-gray-300 transition"
                    >
                        Batal
                    </Link>
                </div>

                {/* Debug ringan (hapus kalau udah beres) */}
                {Object.keys(errors || {}).length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <div className="font-semibold mb-2">Validasi gagal:</div>
                        <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(errors).map(([k, v]) => (
                                <li key={k}>
                                    <span className="font-medium">{k}:</span> {v}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </form>
        </AdminLayout>
    );
}
