<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function __construct()
    {
        // Pastikan hanya user yang terautentikasi bisa mengakses
        // $this->middleware('auth');
    }

    /**
     * Tandai 1 notifikasi sebagai terbaca.
     * POST /notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = Auth::user();

        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan.'
            ], Response::HTTP_NOT_FOUND);
        }

        // Pastikan notifikasi milik user yang sedang login
        $userKey = $user->id; // id_pengguna
        $expectedType = get_class($user); // ex: App\Models\User

        // Accept if stored notifiable_type equals class or base name contains 'User'
        $typeMatches = $notification->notifiable_type === $expectedType
            || class_basename($notification->notifiable_type) === class_basename($expectedType)
            || str_contains($notification->notifiable_type, 'User');

        if (! $typeMatches || (string)$notification->notifiable_id !== (string)$userKey) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak untuk notifikasi ini.'
            ], Response::HTTP_FORBIDDEN);
        }

        // Tandai terbaca (optimistik)
        $notification->read_at = Carbon::now();
        $notification->save();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai terbaca.',
            'notification' => $notification
        ], Response::HTTP_OK);
    }

    /**
     * Tandai semua notifikasi milik user saat ini sebagai terbaca.
     * POST /notifications/mark-all
     */
    public function markAllRead(Request $request)
    {
        $user = Auth::user();
        $userKey = $user->id;
        $expectedType = get_class($user);

        // Ambil notifikasi belum dibaca milik user, lalu update
        $query = Notification::where('notifiable_id', $userKey)
            ->where(function($q) use ($expectedType) {
                $q->where('notifiable_type', $expectedType)
                  ->orWhere('notifiable_type', 'like', '%' . class_basename($expectedType) . '%')
                  ->orWhere('notifiable_type', 'like', '%User%');
            })
            ->whereNull('read_at');

        $count = $query->count();

        if ($count === 0) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada notifikasi baru.',
                'marked' => 0
            ], Response::HTTP_OK);
        }

        $now = Carbon::now();
        $updated = $query->update(['read_at' => $now]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai terbaca.',
            'marked' => $updated
        ], Response::HTTP_OK);
    }
}
