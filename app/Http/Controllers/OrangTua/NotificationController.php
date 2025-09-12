<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;


class NotificationController extends Controller
{
    /**
     * Menampilkan daftar notifikasi untuk orang tua yang login.
     * Menggunakan pagination untuk efisiensi.
     */
    public function index()
    {
        $user = Auth::user();
        $notifications = $user->notifications?->paginate(15);
        $unreadNotifications = $user->unreadNotifications?->get();

        return Inertia::render('OrangTua/Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadNotifications->count(),
        ]);
    }

    /**
     * Menandai satu notifikasi sebagai sudah dibaca.
     */
    public function markAsRead(Request $request)
    {
        $user = Auth::user();
        $notificationId = $request->input('id');

        if ($notificationId) {
            $notification = $user->notifications?->where('id', $notificationId)->first();
            if ($notification) {
                $notification->markAsRead();
            }
        }
        
        return back();
    }

    /**
     * Menandai semua notifikasi sebagai sudah dibaca.
     */
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();
        return back();
    }
}