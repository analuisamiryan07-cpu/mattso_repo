<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador Principal',
                'email' => 'admin@expansion.com',
                'password' => Hash::make('Admin123*'),
                'role' => 'admin',
                'must_change_password' => true,
            ]
        );
    }
}
