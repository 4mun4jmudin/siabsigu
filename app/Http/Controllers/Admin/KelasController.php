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
            ->get();

        // Ambil ID guru yang sudah menjadi wali kelas
        $assignedWaliIds = Kelas::whereNotNull('id_wali_kelas')->pluck('id_wali_kelas')->toArray();

        // Ambil guru aktif dan tambahkan flag is_assigned untuk filtering di frontend
        $guruOptions = Guru::where('status', 'Aktif')->get()->map(function ($guru) use ($assignedWaliIds) {
            $guru->is_assigned = in_array($guru->id_guru, $assignedWaliIds);
            return $guru;
        });

        return Inertia::render('admin/Kelas/Index', [
            'kelasList' => $kelasList,
            'stats' => $stats,
            'filters' => $request->only(['search']),
            'guruOptions' => $guruOptions,
        ]);
    }

    /**
     * Menampilkan halaman detail sebuah kelas dengan data untuk tab.
     */
    public function show(Request $request, Kelas $kela)
    {
        // Eager load relasi wali kelas
        $kela->load(['waliKelas']);

        // Ambil daftar siswa di kelas ini dengan pencarian & paginasi
        $siswasInKelas = Siswa::where('id_kelas', $kela->id_kelas)
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nama_lengkap', 'like', "%{$search}%")
                      ->orWhere('nis', 'like', "%{$search}%");
                });
            })
            ->get();

        // Ambil data untuk tab "Jadwal Pelajaran"
        $jadwalPelajaran = JadwalMengajar::where('id_kelas', $kela->id_kelas)
            ->with(['guru', 'mataPelajaran']) // Eager load relasi guru & mapel
            ->get()
            ->sortBy(function($jadwal) { // Urutkan berdasarkan hari
                $daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                return array_search($jadwal->hari, $daysOrder);
            });

        // Ambil ID guru yang sudah menjadi wali kelas
        $assignedWaliIds = Kelas::whereNotNull('id_wali_kelas')->pluck('id_wali_kelas')->toArray();

        // Ambil guru aktif dan tambahkan flag is_assigned untuk filtering di frontend
        $guruOptions = Guru::where('status', 'Aktif')->get()->map(function ($guru) use ($assignedWaliIds) {
            $guru->is_assigned = in_array($guru->id_guru, $assignedWaliIds);
            return $guru;
        });

        return Inertia::render('admin/Kelas/Show', [
            'kelas' => $kela,
            'siswasInKelas' => $siswasInKelas,
            'jadwalPelajaran' => $jadwalPelajaran,
            'filters' => $request->only(['search']),
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
        return back()->with('status', 'Data Kelas berhasil ditambahkan.');
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
        return back()->with('status', 'Data Kelas berhasil diperbarui.');
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
        return to_route('admin.kelas.index')->with('message', 'Data Kelas berhasil dihapus.');
    }
}
