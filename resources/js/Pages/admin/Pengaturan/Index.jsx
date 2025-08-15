import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';

export default function Index({ auth, pengaturan }) {
    const { data, setData, put, processing, errors } = useForm({
        jam_masuk: pengaturan.jam_masuk || '07:30',
        jam_pulang: pengaturan.jam_pulang || '15:00',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.pengaturan.update'));
    };

    return (
        <AdminLayout user={auth.user} header="Pengaturan Umum">
            <Head title="Pengaturan Umum" />

            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                        <Cog6ToothIcon className="h-8 w-8 text-gray-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Pengaturan Jam Kerja</h1>
                            <p className="text-sm text-gray-500">Atur jam masuk dan pulang standar untuk guru.</p>
                        </div>
                    </div>
                    
                    <form onSubmit={submit}>
                        <div className="space-y-6">
                            <div>
                                <InputLabel htmlFor="jam_masuk" value="Jam Masuk Sekolah" />
                                <TextInput
                                    id="jam_masuk"
                                    type="time"
                                    name="jam_masuk"
                                    value={data.jam_masuk}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('jam_masuk', e.target.value)}
                                />
                                <InputError message={errors.jam_masuk} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="jam_pulang" value="Jam Pulang Sekolah" />
                                <TextInput
                                    id="jam_pulang"
                                    type="time"
                                    name="jam_pulang"
                                    value={data.jam_pulang}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('jam_pulang', e.target.value)}
                                />
                                <InputError message={errors.jam_pulang} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center justify-end mt-8">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
