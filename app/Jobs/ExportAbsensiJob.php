<?php

namespace App\Jobs;

use App\Exports\AbsensiSiswaExport;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ExportAbsensiJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan ulang jika gagal.
     */
    public int $tries = 2;

    /**
     * Timeout dalam detik (5 menit).
     */
    public int $timeout = 300;

    public function __construct(
        public int    $userId,
        public string $format,   // 'excel' | 'pdf'
        public array  $filters,
    ) {}

    public function handle(): void
    {
        $tanggal   = Carbon::parse($this->filters['tanggal'])->format('d-m-Y');
        $kelas     = !empty($this->filters['id_kelas']) ? Kelas::find($this->filters['id_kelas']) : null;
        $namaKelas = $kelas
            ? trim(($kelas->tingkat ?? '') . ' ' . ($kelas->jurusan ?? '')) ?: ($kelas->nama_kelas ?? 'Kelas')
            : 'Semua-Kelas';

        $directory = 'exports';
        Storage::disk('local')->makeDirectory($directory);

        if ($this->format === 'excel') {
            $fileName = "absensi-siswa-{$namaKelas}-{$tanggal}.xlsx";
            $path     = "{$directory}/{$fileName}";

            Excel::store(new AbsensiSiswaExport($this->filters), $path, 'local');
        } else {
            $fileName = "absensi-siswa-{$namaKelas}-{$tanggal}.pdf";
            $path     = "{$directory}/{$fileName}";

            $data = Siswa::query()
                ->with(['absensi' => fn ($q) => $q->whereDate('tanggal', $this->filters['tanggal'])])
                ->when($this->filters['id_kelas'] ?? null, fn ($q, $id) => $q->where('id_kelas', $id))
                ->orderBy('nama_lengkap')
                ->lazy(100);

            $pdf = Pdf::loadView('pdf.absensi_siswa_pdf', [
                'dataSiswa' => $data,
                'namaKelas' => $namaKelas,
                'tanggal'   => Carbon::parse($this->filters['tanggal'])->toDateString(),
            ]);

            Storage::disk('local')->put($path, $pdf->output());
        }

        // Kirim notifikasi ke user (database notification)
        $user = User::find($this->userId);
        if ($user) {
            $user->notify(new \App\Notifications\ExportReadyNotification($fileName, $path));
        }

        Log::info("Export selesai: {$path} untuk user #{$this->userId}");
    }
}
