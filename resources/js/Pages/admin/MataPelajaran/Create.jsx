import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Create({ auth, gurus, kelasList }) {
    const { data, setData, post, processing, errors } = useForm({
        nama_mapel: "",
        kategori: "Wajib",
        kkm: "",
        status: "Aktif", // <-- State baru ditambahkan
        jumlah_jp: "", // <-- State baru ditambahkan
        jadwal: [],
    });

    // Fungsi untuk menambah baris jadwal baru
    const addJadwalRow = () => {
        setData("jadwal", [
            ...data.jadwal,
            {
                id_guru: "",
                id_kelas: "",
                hari: "Senin",
                jam_mulai: "",
                jam_selesai: "",
            },
        ]);
    };

    // Fungsi untuk menghapus baris jadwal
    const removeJadwalRow = (index) => {
        const newJadwal = [...data.jadwal];
        newJadwal.splice(index, 1);
        setData("jadwal", newJadwal);
    };

    // Fungsi untuk mengubah data pada baris jadwal
    const handleJadwalChange = (index, field, value) => {
        const newJadwal = [...data.jadwal];
        newJadwal[index][field] = value;
        setData("jadwal", newJadwal);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("mata-pelajaran.store"));
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Mata Pelajaran">
            <Head title="Tambah Mata Pelajaran" />
            <div className="max-w-4xl mx-auto">
                <form onSubmit={submit} className="space-y-8">
                    {/* Bagian Detail Mata Pelajaran */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Detail Mata Pelajaran
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel
                                    htmlFor="nama_mapel"
                                    value="Nama Mata Pelajaran"
                                />
                                <TextInput
                                    id="nama_mapel"
                                    value={data.nama_mapel}
                                    onChange={(e) =>
                                        setData("nama_mapel", e.target.value)
                                    }
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                />
                                <InputError
                                    message={errors.nama_mapel}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="kategori"
                                    value="Kategori"
                                />
                                <select
                                    id="kategori"
                                    value={data.kategori}
                                    onChange={(e) =>
                                        setData("kategori", e.target.value)
                                    }
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option>Wajib</option>
                                    <option>Peminatan</option>
                                    <option>Muatan Lokal</option>
                                </select>
                                <InputError
                                    message={errors.kategori}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="kkm" value="KKM" />
                                <TextInput
                                    id="kkm"
                                    type="number"
                                    value={data.kkm}
                                    onChange={(e) =>
                                        setData("kkm", e.target.value)
                                    }
                                    className="mt-1 block w-full"
                                />
                                <InputError
                                    message={errors.kkm}
                                    className="mt-2"
                                />
                            </div>
                            {/* Field Baru: Status */}
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option>Aktif</option>
                                    <option>Tidak Aktif</option>
                                </select>
                                <InputError
                                    message={errors.status}
                                    className="mt-2"
                                />
                            </div>

                            {/* Field Baru: Jumlah JP */}
                            <div className="md:col-span-2">
                                <InputLabel
                                    htmlFor="jumlah_jp"
                                    value="Jumlah Jam Pelajaran / Minggu"
                                />
                                <TextInput
                                    id="jumlah_jp"
                                    type="number"
                                    value={data.jumlah_jp}
                                    onChange={(e) =>
                                        setData("jumlah_jp", e.target.value)
                                    }
                                    className="mt-1 block w-full"
                                />
                                <InputError
                                    message={errors.jumlah_jp}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bagian Jadwal Mengajar */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                Jadwal Mengajar
                            </h2>
                            <button
                                type="button"
                                onClick={addJadwalRow}
                                className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" /> Tambah
                                Jadwal
                            </button>
                        </div>
                        <InputError message={errors.jadwal} className="mb-4" />
                        <div className="space-y-4">
                            {data.jadwal.map((jadwal, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg relative"
                                >
                                    <div className="md:col-span-3">
                                        <InputLabel value="Guru Pengampu" />
                                        <select
                                            value={jadwal.id_guru}
                                            onChange={(e) =>
                                                handleJadwalChange(
                                                    index,
                                                    "id_guru",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            <option value="">Pilih Guru</option>
                                            {gurus.map((guru) => (
                                                <option
                                                    key={guru.id_guru}
                                                    value={guru.id_guru}
                                                >
                                                    {guru.nama_lengkap}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                errors[
                                                    `jadwal.${index}.id_guru`
                                                ]
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <InputLabel value="Kelas" />
                                        <select
                                            value={jadwal.id_kelas}
                                            onChange={(e) =>
                                                handleJadwalChange(
                                                    index,
                                                    "id_kelas",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            <option value="">
                                                Pilih Kelas
                                            </option>
                                            {kelasList.map((k) => (
                                                <option
                                                    key={k.id_kelas}
                                                    value={k.id_kelas}
                                                >
                                                    {k.tingkat}-{k.jurusan}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                errors[
                                                    `jadwal.${index}.id_kelas`
                                                ]
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputLabel value="Hari" />
                                        <select
                                            value={jadwal.hari}
                                            onChange={(e) =>
                                                handleJadwalChange(
                                                    index,
                                                    "hari",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            {[
                                                "Senin",
                                                "Selasa",
                                                "Rabu",
                                                "Kamis",
                                                "Jumat",
                                                "Sabtu",
                                            ].map((day) => (
                                                <option key={day}>{day}</option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                errors[`jadwal.${index}.hari`]
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputLabel value="Jam Mulai" />
                                        <TextInput
                                            type="time"
                                            value={jadwal.jam_mulai}
                                            onChange={(e) =>
                                                handleJadwalChange(
                                                    index,
                                                    "jam_mulai",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full"
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `jadwal.${index}.jam_mulai`
                                                ]
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputLabel value="Jam Selesai" />
                                        <TextInput
                                            type="time"
                                            value={jadwal.jam_selesai}
                                            onChange={(e) =>
                                                handleJadwalChange(
                                                    index,
                                                    "jam_selesai",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full"
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `jadwal.${index}.jam_selesai`
                                                ]
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeJadwalRow(index)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-100"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                            {data.jadwal.length === 0 && (
                                <p className="text-center text-gray-500 py-4">
                                    Belum ada jadwal. Klik "Tambah Jadwal" untuk
                                    memulai.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center justify-end mt-6">
                        <Link
                            href={route("mata-pelajaran.index")}
                            className="text-sm text-gray-600 hover:text-gray-900 mr-4"
                        >
                            Batal
                        </Link>
                        <PrimaryButton disabled={processing}>
                            {processing
                                ? "Menyimpan..."
                                : "Simpan Mata Pelajaran"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
