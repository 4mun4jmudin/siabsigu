import { forwardRef } from 'react'; // Impor forwardRef
import { useForm } from "@inertiajs/react";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

// Gunakan forwardRef untuk meneruskan ref ke form
const FilterLaporan = forwardRef(function FilterLaporan({ initialFilters, kelasOptions = [] }, ref) {
    const { data, setData, get, processing } = useForm({
        periode: initialFilters.periode || "bulanan",
        bulan: initialFilters.bulan || new Date().toISOString().slice(0, 7),
        id_kelas: initialFilters.id_kelas || "semua",
    });

    const submit = (e) => {
        e.preventDefault();
        get(route("admin.laporan.index"), {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Laporan</h3>
            {/* Teruskan ref ke elemen form */}
            <form ref={ref} onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label htmlFor="periode" className="block text-sm font-medium text-gray-700">Periode</label>
                    <select id="periode" name="periode" value={data.periode} onChange={(e) => setData("periode", e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="bulanan">Bulanan</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="bulan" className="block text-sm font-medium text-gray-700">Bulan</label>
                    <input type="month" id="bulan" name="bulan" value={data.bulan} onChange={(e) => setData("bulan", e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                </div>
                <div>
                    <label htmlFor="id_kelas" className="block text-sm font-medium text-gray-700">Kelas</label>
                    <select id="id_kelas" name="id_kelas" value={data.id_kelas} onChange={(e) => setData("id_kelas", e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="semua">Semua Kelas</option>
                        {kelasOptions.map((kelas) => (
                             <option key={kelas.id_kelas} value={kelas.id_kelas}>{kelas.nama_lengkap}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <button type="submit" disabled={processing} className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 transition">
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                        Generate
                    </button>
                </div>
            </form>
        </div>
    );
});

export default FilterLaporan;