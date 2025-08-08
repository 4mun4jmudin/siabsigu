<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Membuat User Admin
        User::create([
            'nama_lengkap' => 'Administrator',
            'username' => 'admin',
            'email' => 'admin@sisab.com',
            'password' => Hash::make('password'),
            'level' => 'Admin'
        ]);

        // Contoh membuat User Guru
        User::create([
            'nama_lengkap' => 'Guru Pengajar',
            'username' => 'guru',
            'email' => 'guru@sisab.com',
            'password' => Hash::make('password'),
            'level' => 'Guru'
        ]);
    }
}