<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\OrangTuaWali;
use App\Models\AbsensiSiswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Http;
use Maatwebsite\Excel\Facades\Excel; // Pastikan package maatwebsite/excel sudah terinstal

class SiswaController extends Controller
{
    /**
     * Menampilkan halaman daftar siswa dengan filter dan paginasi.
     */
    public function index(Request $request)
    {
        $kelasOptions = Kelas::orderBy('tingkat')->get();

        $siswas = Siswa::with('kelas')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            })
            ->when($request->input('kelas'), function ($query, $kelasId) {
                $query->where('id_kelas', $kelasId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // ✅ Tambahkan foto_url untuk setiap siswa
        $siswas->through(function ($s) {
            $s->foto_url = null;
            if ($s->foto_profil && Storage::disk('public')->exists($s->foto_profil)) {
                $s->foto_url = url('/storage-public/' . ltrim($s->foto_profil, '/'));
            }
            return $s;
        });

        return Inertia::render('admin/Siswa/Index', [
            'siswas' => $siswas,
            'kelasOptions' => $kelasOptions,
            'filters' => $request->only(['search', 'kelas']),
        ]);
    }

    /**
     * Menampilkan form untuk membuat data siswa baru.
     */
    public function create()
    {
        return Inertia::render('admin/Siswa/Create', [
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    /**
     * Menyimpan data siswa baru beserta akun pengguna yang terhubung secara otomatis.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_siswa' => 'required|string|max:20|unique:tbl_siswa',
            'nis' => 'required|string|max:30|unique:tbl_siswa|unique:tbl_pengguna,username',
            'nisn' => 'required|string|max:20|unique:tbl_siswa',
            'id_kelas' => 'required|exists:tbl_kelas,id_kelas',
            'nama_lengkap' => 'required|string|max:100',
            'nama_panggilan' => 'nullable|string|max:30',
            'foto_profil' => 'nullable|image|max:2048',
            'nik' => 'required|string|max:16|unique:tbl_siswa',
            'nomor_kk' => 'required|string|max:16',
            'tempat_lahir' => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'agama' => 'required|string',
            'alamat_lengkap' => 'required|string',
            'status' => 'required|in:Aktif,Lulus,Pindah,Drop Out',
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => 'nullable|string|max:100|unique:tbl_siswa,barcode_id',
        ]);

        try {
            DB::transaction(function () use ($request, $validated) {
                $user = User::create([
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'username' => $validated['nis'],
                    'password' => Hash::make($validated['nis']),
                    'level' => 'Siswa',
                ]);

                $validated['id_pengguna'] = $user->id_pengguna;

                if ($request->hasFile('foto_profil')) {
                    $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
                    $validated['foto_profil'] = $path;
                }

                Siswa::create($validated);
            });

            return to_route('admin.siswa.index')
                ->with('success', 'Data Siswa berhasil ditambahkan beserta akun loginnya.');
        } catch (\Throwable $e) {
            Log::error('STORE SISWA ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->with('error', 'Gagal menambahkan siswa. Coba lagi.')
                ->withInput();
        }
    }

    /**
     * Menampilkan halaman detail untuk seorang siswa.
     */
    public function show(Siswa $siswa)
    {
        $siswa->load('kelas.waliKelas');

        $orangTuaWali = OrangTuaWali::where('id_siswa', $siswa->id_siswa)->get();

        $riwayatAbsensi = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->latest('tanggal')
            ->take(30)
            ->get();

        $fotoUrl = null;
        if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
            $fotoUrl = url('/storage-public/' . ltrim($siswa->foto_profil, '/'));
        }

        return Inertia::render('admin/Siswa/Show', [
            'siswa' => array_merge($siswa->toArray(), [
                'foto_url' => $fotoUrl,
            ]),
            'orangTuaWali' => $orangTuaWali,
            'riwayatAbsensi' => $riwayatAbsensi,
        ]);
    }

    /**
     * Menampilkan form untuk mengedit data siswa.
     */
    public function edit(Siswa $siswa)
    {
        return Inertia::render('admin/Siswa/Edit', [
            'siswa' => $siswa,
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    /**
     * Memperbarui data siswa di database.
     */
    public function update(Request $request, Siswa $siswa)
    {
        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:30', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'nisn' => ['required', 'string', 'max:20', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'id_kelas' => 'required|exists:tbl_kelas,id_kelas',
            'nama_lengkap' => 'required|string|max:100',
            'nama_panggilan' => 'nullable|string|max:30',
            'foto_profil' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'nik' => ['required', 'string', 'max:16', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'nomor_kk' => 'required|string|max:16',
            'tempat_lahir' => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'agama' => 'required|string',
            'alamat_lengkap' => 'required|string',
            'status' => 'required|in:Aktif,Lulus,Pindah,Drop Out',
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
        ]);

        try {
            DB::transaction(function () use ($request, $siswa, $validated) {
                if ($request->hasFile('foto_profil')) {
                    $file = $request->file('foto_profil');

                    if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
                        Storage::disk('public')->delete($siswa->foto_profil);
                    }

                    $timestamp = now()->timestamp;
                    $filename = "siswa_{$siswa->id_siswa}_{$timestamp}." . $file->getClientOriginalExtension();
                    $path = $file->storeAs('foto_profil_siswa', $filename, 'public');

                    $validated['foto_profil'] = $path;
                }

                $siswa->update($validated);

                if ($siswa->pengguna) {
                    $siswa->pengguna->update([
                        'nama_lengkap' => $validated['nama_lengkap'],
                        'username' => $validated['nis'],
                    ]);
                }
            });

            return to_route('admin.siswa.index')
                ->with('success', 'Data Siswa berhasil diperbarui.');
        } catch (\Throwable $e) {
            Log::error('UPDATE SISWA ERROR', [
                'siswa_id' => $siswa->id_siswa,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->with('error', 'Gagal memperbarui data siswa. Periksa input & coba lagi.')
                ->withInput();
        }
    }

    /**
     * Memperbarui data keamanan (barcode & sidik jari) untuk siswa.
     */
    public function updateKeamanan(Request $request, Siswa $siswa)
    {
        $validated = $request->validate([
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_siswa', 'barcode_id')->ignore($siswa->id_siswa, 'id_siswa')],
        ]);

        try {
            if ($request->input('generate_barcode') && empty($validated['barcode_id'])) {
                $validated['barcode_id'] = 'SISWA-' . Str::upper(Str::random(10));
            }

            $siswa->update($validated);

            return redirect()->route('admin.siswa.show', $siswa->id_siswa)
                ->with('success', 'Data keamanan berhasil diperbarui.');
        } catch (\Throwable $e) {
            Log::error('UPDATE KEAMANAN SISWA ERROR', [
                'siswa_id' => $siswa->id_siswa,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Gagal memperbarui data keamanan. Coba lagi.');
        }
    }

    /**
     * Membuat akun pengguna secara massal untuk siswa yang belum memilikinya.
     */
    public function generateMissingAccounts()
    {
        try {
            $studentsToProcess = Siswa::where('status', 'Aktif')
                ->whereNull('id_pengguna')
                ->get();

            $createdCount = 0;
            $failedCount = 0;

            foreach ($studentsToProcess as $siswa) {
                DB::transaction(function () use ($siswa, &$createdCount, &$failedCount) {
                    $userExists = User::where('username', $siswa->nis)->exists();

                    if ($userExists) {
                        $failedCount++;
                        return;
                    }

                    $user = User::create([
                        'nama_lengkap' => $siswa->nama_lengkap,
                        'username' => $siswa->nis,
                        'password' => Hash::make($siswa->nis),
                        'level' => 'Siswa',
                    ]);

                    $siswa->id_pengguna = $user->id_pengguna;
                    $siswa->save();

                    $createdCount++;
                });
            }

            if ($createdCount === 0 && $failedCount === 0) {
                return back()->with('success', 'Semua siswa aktif sudah memiliki akun.');
            }

            $message = "Proses selesai. Berhasil membuat {$createdCount} akun baru.";
            if ($failedCount > 0) {
                $message .= " Gagal membuat {$failedCount} akun karena NIS sudah terdaftar sebagai username.";
            }

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            Log::error('GENERATE ACCOUNT ERROR', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal membuat akun massal. Coba lagi.');
        }
    }

    /**
     * Menghapus data siswa dan akun pengguna yang terhubung.
     */
    public function destroy(Siswa $siswa)
    {
        try {
            DB::transaction(function () use ($siswa) {
                if ($siswa->foto_profil) {
                    Storage::disk('public')->delete($siswa->foto_profil);
                }

                if ($siswa->pengguna) {
                    $siswa->pengguna->delete();
                }

                $siswa->delete();
            });

            return redirect()->back(303)
                ->with('success', 'Data Siswa berhasil dihapus beserta akun loginnya.');
        } catch (\Throwable $e) {
            Log::error('DELETE SISWA ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus siswa. Coba lagi.')
                ->withInput();
        }
    }

    /**
     * Menampilkan halaman khusus Reset Password.
     */
    public function resetPasswordIndex(Request $request)
    {
        $siswas = Siswa::with('kelas', 'pengguna')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            })
            ->whereNotNull('id_pengguna')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $siswas->through(function ($s) {
            $s->foto_url = null;
            if ($s->foto_profil && Storage::disk('public')->exists($s->foto_profil)) {
                $s->foto_url = url('/storage-public/' . ltrim($s->foto_profil, '/'));
            }
            return $s;
        });

        return Inertia::render('admin/Siswa/ResetPassword', [
            'siswas' => $siswas,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Memproses reset password ke default (NIS).
     */
    public function resetPasswordStore(Siswa $siswa)
    {
        try {
            if (!$siswa->pengguna) {
                return back()->with('error', 'Siswa ini belum memiliki akun pengguna.');
            }

            $siswa->pengguna->update([
                'password' => Hash::make($siswa->nis),
                'username' => $siswa->nis,
            ]);

            return back()->with('success', "Akun siswa {$siswa->nama_lengkap} berhasil direset. Login menggunakan NIS.");
        } catch (\Throwable $e) {
            Log::error('RESET PASSWORD ERROR', ['error' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan saat mereset password.');
        }
    }

    /**
     * Export Data Siswa ke PDF
     */
    public function exportPdf(Request $request)
    {
        $query = Siswa::with('kelas');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        if ($request->has('kelas') && $request->input('kelas') != '') {
            $query->where('id_kelas', $request->input('kelas'));
        }

        $siswas = $query->orderBy('nama_lengkap')->get();

        $pdf = Pdf::loadView('pdf.siswa_all', ['siswas' => $siswas])
                  ->setPaper('a4', 'landscape');

        return $pdf->download('Data_Siswa_' . date('Y-m-d_H-i') . '.pdf');
    }

    /**
     * Menghapus banyak siswa sekaligus (Bulk Delete).
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:tbl_siswa,id_siswa',
        ]);

        $ids = $request->ids;
        $count = 0;

        try {
            DB::transaction(function () use ($ids, &$count) {
                $students = Siswa::whereIn('id_siswa', $ids)->get();

                foreach ($students as $siswa) {
                    if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
                        Storage::disk('public')->delete($siswa->foto_profil);
                    }
                    if ($siswa->pengguna) {
                        $siswa->pengguna->delete();
                    }
                    $siswa->delete();
                    $count++;
                }
            });

            return back()->with('success', "Berhasil menghapus {$count} data siswa.");
        } catch (\Throwable $e) {
            Log::error('BULK DELETE ERROR', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal menghapus data massal.');
        }
    }

    /**
     * Update massal (Pindah Kelas atau Ganti Status).
     */
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:tbl_siswa,id_siswa',
            'type' => 'required|in:kelas,status',
            'value' => 'required', 
        ]);

        $ids = $request->ids;
        $type = $request->type;
        $value = $request->value;
        $updatedCount = 0;

        try {
            DB::transaction(function () use ($ids, $type, $value, &$updatedCount) {
                $updateData = [];
                
                if ($type === 'kelas') {
                    $updateData['id_kelas'] = $value;
                } elseif ($type === 'status') {
                    $updateData['status'] = $value;
                }

                $updatedCount = Siswa::whereIn('id_siswa', $ids)->update($updateData);
            });

            return back()->with('success', "Berhasil memperbarui {$updatedCount} data siswa.");
        } catch (\Throwable $e) {
            Log::error('BULK UPDATE ERROR', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal melakukan update massal.');
        }
    }

    // --- IMPORT FITUR (NEW) ---

    public function downloadTemplate()
    {
        $headers = ['NIS', 'NISN', 'Nama Lengkap', 'Kelas (Contoh: X RPL 1)', 'Jenis Kelamin (L/P)', 'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)', 'NIK'];
        $callback = function() use ($headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=template_siswa.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ]);
    }

    private function readFileData($filePath)
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        if ($extension === 'csv' || $extension === 'txt') {
            if (($handle = fopen($filePath, "r")) !== FALSE) {
                $line = fgets($handle);
                rewind($handle);
                $delimiter = (strpos($line, ';') !== false) ? ';' : ',';

                $headers = fgetcsv($handle, 1000, $delimiter);
                $sampleRow = fgetcsv($handle, 1000, $delimiter);
                fclose($handle);
                
                if (isset($headers[0])) {
                    $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
                }

                return ['headers' => $headers, 'sample' => $sampleRow, 'all_rows' => null];
            }
        } 
        else if (in_array($extension, ['xlsx', 'xls'])) {
            try {
                $data = Excel::toArray([], $filePath);
                if (isset($data[0]) && count($data[0]) > 0) {
                    $headers = $data[0][0]; 
                    $sampleRow = isset($data[0][1]) ? $data[0][1] : [];
                    return ['headers' => $headers, 'sample' => $sampleRow, 'all_rows' => $data[0]];
                }
            } catch (\Exception $e) {
                Log::error("Gagal baca Excel: " . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    public function previewImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls'
        ], [
            'file.mimes' => 'Format file harus CSV atau Excel (.xlsx, .xls).'
        ]);

        $file = $request->file('file');
        $path = $file->store('temp_imports');
        $fullPath = Storage::path($path);

        $fileData = $this->readFileData($fullPath);

        if (!$fileData || empty($fileData['headers'])) {
            return response()->json(['message' => 'Gagal membaca header file. Pastikan format benar.'], 400);
        }

        $headers = $fileData['headers'];
        $sampleRow = $fileData['sample'];

        $guesses = [];
        $apiKey = env('GEMINI_API_KEY');

        if ($apiKey) {
            try {
                $targetFields = [
                    'nis' => 'Nomor Induk Siswa / NIPD',
                    'nisn' => 'Nomor Induk Siswa Nasional',
                    'nama_lengkap' => 'Nama Peserta Didik / Nama Siswa',
                    'kelas' => 'Kelas / Rombel / Jurusan',
                    'jenis_kelamin' => 'Jenis Kelamin (L/P) / Gender',
                    'tempat_lahir' => 'Tempat Lahir',
                    'tanggal_lahir' => 'Tanggal Lahir',
                    'nik' => 'NIK / Nomor KTP',
                    'nomor_kk' => 'Nomor KK',
                    'alamat_lengkap' => 'Alamat / Jalan'
                ];

                $prompt = "I have a CSV/Excel file with the following headers (indexed 0-" . (count($headers)-1) . "): " . json_encode($headers) . ". \n";
                $prompt .= "Please map these headers to the following database fields: " . json_encode($targetFields) . ". \n";
                $prompt .= "Return ONLY a valid JSON object where the keys are the database fields (e.g., 'nis', 'nama_lengkap') and the values are the integer index of the matching header. If no match is found for a field, omit it from the JSON. Be smart about abbreviations (e.g. 'JK' = 'jenis_kelamin', 'NIPD' = 'nis'). Do not include markdown formatting.";

                $response = Http::withHeaders([
                    'Content-Type' => 'application/json'
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

                if ($response->successful()) {
                    $content = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                    $content = str_replace(['```json', '```'], '', $content);
                    $guesses = json_decode($content, true);
                } else {
                    $guesses = $this->getManualGuesses($headers);
                }

            } catch (\Exception $e) {
                $guesses = $this->getManualGuesses($headers);
            }
        } else {
            $guesses = $this->getManualGuesses($headers);
        }

        return response()->json([
            'headers' => $headers,
            'rows' => [$sampleRow],
            'guesses' => $guesses,
            'temp_path' => $path
        ]);
    }

    private function getManualGuesses($headers) {
        $guesses = [];
        $dbFields = [
            'nis' => ['nipd', 'nis', 'nomor induk', 'induk'],
            'nisn' => ['nisn', 'nomor induk siswa nasional'],
            'nama_lengkap' => ['nama', 'nama lengkap', 'peserta didik', 'nama siswa'],
            'kelas' => ['rombel', 'kelas', 'jurusan'],
            'jenis_kelamin' => ['jk', 'l/p', 'jenis kelamin', 'gender'],
            'tempat_lahir' => ['tempat lahir', 'tmp lahir'],
            'tanggal_lahir' => ['tanggal lahir', 'tgl lahir', 'dob'],
            'nik' => ['nik', 'no ktp'],
            'nomor_kk' => ['no kk', 'kartu keluarga'],
            'alamat_lengkap' => ['alamat', 'jalan'],
        ];

        foreach ($dbFields as $fieldKey => $keywords) {
            foreach ($keywords as $keyword) {
                foreach ($headers as $index => $header) {
                    $h = strtolower($header);
                    if ($fieldKey == 'nama_lengkap' && (str_contains($h, 'ayah') || str_contains($h, 'ibu') || str_contains($h, 'wali'))) continue;
                    if ($fieldKey == 'nik' && (str_contains($h, 'ayah') || str_contains($h, 'ibu') || str_contains($h, 'wali'))) continue;
                    
                    if ($h === $keyword || (strlen($keyword) > 2 && str_contains($h, $keyword))) {
                        $guesses[$fieldKey] = $index;
                        break 2;
                    }
                }
            }
        }
        return $guesses;
    }

    public function importStore(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'mappings' => 'required|array'
        ]);

        if (!Storage::exists($request->file_path)) {
            return response()->json(['message' => 'File expired. Silakan upload ulang.'], 400);
        }

        $path = Storage::path($request->file_path);
        $mappings = $request->mappings;

        $success = 0;
        $failed = 0;
        $errors = [];
        $rowNumber = 1; 

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $dataRows = [];

        if ($extension === 'csv' || $extension === 'txt') {
            if (($handle = fopen($path, "r")) !== FALSE) {
                $line = fgets($handle);
                rewind($handle);
                $delimiter = (strpos($line, ';') !== false) ? ';' : ',';
                fgetcsv($handle, 1000, $delimiter); 
                while (($row = fgetcsv($handle, 1000, $delimiter)) !== FALSE) {
                    $dataRows[] = $row;
                }
                fclose($handle);
            }
        } else {
            try {
                $sheets = Excel::toArray([], $path);
                if (isset($sheets[0])) {
                    $dataRows = array_slice($sheets[0], 1);
                }
            } catch (\Exception $e) {
                return response()->json(['message' => 'Gagal memproses file Excel: ' . $e->getMessage()], 400);
            }
        }

        foreach ($dataRows as $data) {
            $rowNumber++;
            if (empty(array_filter($data, function($val) { return !is_null($val) && $val !== ''; }))) continue;

            try {
                $getVal = fn($key) => isset($mappings[$key]) && isset($data[$mappings[$key]]) ? trim($data[$mappings[$key]]) : null;

                $nis = $getVal('nis');
                $nama = $getVal('nama_lengkap');
                $kelasRaw = $getVal('kelas');

                if (!$nis || !$nama) throw new \Exception("NIS atau Nama kosong.");

                if (Siswa::where('nis', $nis)->exists()) {
                    throw new \Exception("NIS $nis sudah terdaftar.");
                }

                $idKelas = null;
                if ($kelasRaw) {
                    $kelasRaw = trim($kelasRaw);
                    
                    // 1. Coba Exact Match "X RPL 1"
                    $idKelas = Kelas::whereRaw("UPPER(CONCAT(tingkat, ' ', jurusan)) = ?", [strtoupper($kelasRaw)])->value('id_kelas');

                    // 2. Coba Pecah String (Spasi)
                    if (!$idKelas) {
                        $parts = explode(' ', $kelasRaw, 2);
                        if (count($parts) == 2) {
                            $idKelas = Kelas::where('tingkat', $parts[0])
                                ->where('jurusan', 'LIKE', "%{$parts[1]}%")
                                ->value('id_kelas');
                        }
                    }

                    // 3. Fallback: Cari jurusan saja
                    if (!$idKelas) {
                        $idKelas = Kelas::where('jurusan', 'LIKE', "%{$kelasRaw}%")->value('id_kelas');
                    }
                }

                if (!$idKelas) {
                    throw new \Exception("Kelas '$kelasRaw' tidak ditemukan di database. Pastikan format sesuai (Cth: X RPL 1).");
                }

                $jkRaw = strtoupper($getVal('jenis_kelamin'));
                $jk = ($jkRaw == 'P' || $jkRaw == 'PEREMPUAN') ? 'Perempuan' : 'Laki-laki';

                $tglLahir = now();
                $tglRaw = $getVal('tanggal_lahir');
                if ($tglRaw) {
                    try {
                        if (is_numeric($tglRaw)) {
                            $tglLahir = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($tglRaw);
                        } else {
                            $tglLahir = \Carbon\Carbon::parse($tglRaw);
                        }
                    } catch (\Exception $e) {}
                }

                // Gunakan Str::random(20) agar sesuai panjang kolom id_siswa
                $idSiswaBaru = Str::random(20);

                DB::transaction(function () use ($idSiswaBaru, $nis, $getVal, $nama, $idKelas, $jk, $tglLahir) {
                    $siswa = Siswa::create([
                        'id_siswa' => $idSiswaBaru, 
                        'nis' => $nis,
                        'nisn' => $getVal('nisn') ?? '-',
                        'nama_lengkap' => $nama,
                        'id_kelas' => $idKelas,
                        'jenis_kelamin' => $jk,
                        'tempat_lahir' => $getVal('tempat_lahir') ?? '-',
                        'tanggal_lahir' => $tglLahir,
                        'nik' => $getVal('nik') ?? null,
                        'nomor_kk' => $getVal('nomor_kk') ?? '-',
                        'agama' => $getVal('agama') ?? 'Islam',
                        'alamat_lengkap' => $getVal('alamat_lengkap') ?? '-',
                        'status' => 'Aktif'
                    ]);

                    if (!User::where('username', $nis)->exists()) {
                        $user = User::create([
                            'nama_lengkap' => $nama,
                            'username' => $nis,
                            'password' => Hash::make($nis),
                            'level' => 'Siswa',
                        ]);
                        $siswa->id_pengguna = $user->id_pengguna;
                        $siswa->save();
                    }
                });

                $success++;
            } catch (\Exception $e) {
                $failed++;
                $identifier = isset($data[1]) ? $data[1] : 'Unknown'; 
                $errors[] = "Baris $rowNumber ($identifier): " . substr($e->getMessage(), 0, 100);
            }
        }

        Storage::delete($request->file_path);

        return response()->json([
            'total' => $success + $failed,
            'success' => $success,
            'failed' => $failed,
            'errors' => $errors
        ]);
    }
}