<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class CreateLocalAdministrator extends Command
{
    protected $signature = 'matsso:create-local-admin
        {--user=admin : Nombre de usuario local}
        {--password= : Contraseña; si se omite se solicitará de forma oculta}';

    protected $description = 'Crea o actualiza un administrador únicamente en entorno local';

    public function handle(): int
    {
        if (! app()->environment('local')) {
            $this->error('Este comando solo se puede ejecutar con APP_ENV=local.');

            return self::FAILURE;
        }

        if (! Schema::hasTable('usuarios_admin')) {
            $this->error('Primero ejecuta php artisan migrate.');

            return self::FAILURE;
        }

        $username = trim((string) $this->option('user'));
        $password = (string) ($this->option('password') ?: $this->secret('Contraseña del administrador'));

        if ($username === '' || $password === '') {
            $this->error('Usuario y contraseña son obligatorios.');

            return self::FAILURE;
        }

        if (mb_strlen($password) < 10) {
            $this->warn('La contraseña es débil. Úsala solo para esta prueba local y cámbiala después.');
        }

        User::query()->updateOrCreate(
            ['usuario' => $username],
            [
                'password_hash' => Hash::make($password),
                'rol' => User::ROLE_ADMIN,
                'activo' => true,
                'nombre_completo' => 'Administrador local',
            ],
        );

        $this->info("Administrador local '{$username}' listo.");

        return self::SUCCESS;
    }
}
