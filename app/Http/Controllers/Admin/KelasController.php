<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\JadwalMengajar;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KelasController extends Controller
{
    /**
     * Menampilkan halaman daftar kelas dengan statistik dan pencarian.
     */
    public function index(Request $request)
    {
        // Menghitung statistik untuk kartu di bagian atas
        $stats = [
            'total' => Kelas::count(),
            'aktif' => Kelas::whereHas('siswa', function ($query) {
                $query->where('status', 'Aktif');
            })->count(), // Asumsi kelas aktif jika punya siswa aktif
            'totalSiswa' => Siswa::where('status', 'Aktif')->count(),
            'denganWali' => Kelas::whereNotNull('id_wali_kelas')->count(),
        ];

        // Query untuk mengambil daftar kelas
        $kelasList = Kelas::with(['waliKelas'])
            ->withCount('siswa') // Menghitung jumlah siswa di setiap kelas
            ->when($request->input('search'), function ($query, $search) {
                $query->where('tingkat', 'like', "%{$search}%")
                      ->orWhere('jurusan', 'like', "%{$search}%")
                      ->orWhereHas('waliKelas', function ($q) use ($search) {
                          $q->where('nama_lengkap', 'like', "%{$search}%");
                      });
            })
            ->latest('tingkat')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Kelas/Index', [
            'kelasList' => $kelasList,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Menampilkan halaman detail sebuah kelas dengan data untuk tab.
     */
    public function show(Kelas $kela)
    {
        // Eager load relasi wali kelas
        $kela->load(['waliKelas']);
        
        // Ambil daftar siswa di kelas ini dengan paginasi
        $siswasInKelas = Siswa::where('id_kelas', $kela->id_kelas)
            ->paginate(10);

        // Ambil data untuk tab "Jadwal Pelajaran"
        $jadwalPelajaran = JadwalMengajar::where('id_kelas', $kela->id_kelas)
            ->with(['guru', 'mataPelajaran']) // Eager load relasi guru & mapel
            ->get()
            ->sortBy(function($jadwal) { // Urutkan berdasarkan hari
                $daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                return array_search($jadwal->hari, $daysOrder);
            });

        return Inertia::render('admin/Kelas/Show', [
            'kelas' => $kela,
            'siswasInKelas' => $siswasInKelas,
            'jadwalPelajaran' => $jadwalPelajaran,
        ]);
    }

    /**
     * Menampilkan form untuk menambah data kelas baru.
     */
    public function create()
    {
        // Ambil guru yang belum menjadi wali kelas
        $guruOptions = Guru::whereDoesntHave('kelasWali')->where('status', 'Aktif')->get();
        return Inertia::render('admin/Kelas/Create', [
            'guruOptions' => $guruOptions,
        ]);
    }

    /**
     * Menyimpan data kelas baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_kelas' => 'required|string|max:20|unique:tbl_kelas',
            'tingkat' => 'required|string|max:10',
            'jurusan' => 'nullable|string|max:50',
            'id_wali_kelas' => 'nullable|exists:tbl_guru,id_guru|unique:tbl_kelas',
        ]);

        Kelas::create($validated);
        return to_route('kelas.index')->with('message', 'Data Kelas berhasil ditambahkan.');
    }

    /**
     * Menampilkan form untuk mengedit data kelas.
     */
    public function edit(Kelas $kela)
    {
        // Ambil guru yang belum menjadi wali kelas ATAU wali kelas saat ini
        $guruOptions = Guru::where('status', 'Aktif')
            ->where(function ($query) use ($kela) {
                $query->whereDoesntHave('kelasWali')
                      ->orWhere('id_guru', $kela->id_wali_kelas);
            })->get();

        return Inertia::render('admin/Kelas/Edit', [
            'kelas' => $kela,
            'guruOptions' => $guruOptions,
        ]);
    }

    /**
     * Memperbarui data kelas di database.
     */
    public function update(Request $request, Kelas $kela)
    {
        $validated = $request->validate([
            'tingkat' => 'required|string|max:10',
            'jurusan' => 'nullable|string|max:50',
            'id_wali_kelas' => ['nullable', 'exists:tbl_guru,id_guru', Rule::unique('tbl_kelas')->ignore($kela->id_kelas, 'id_kelas')],
        ]);

        $kela->update($validated);
        return to_route('kelas.index')->with('message', 'Data Kelas berhasil diperbarui.');
    }

    /**
     * Menghapus data kelas dari database.
     */
    public function destroy(Kelas $kela)
    {
        if ($kela->siswa()->count() > 0) {
            return back()->withErrors(['error' => 'Kelas tidak dapat dihapus karena masih memiliki siswa.']);
        }
        
        $kela->delete();
        return to_route('kelas.index')->with('message', 'Data Kelas berhasil dihapus.');
    }
}
