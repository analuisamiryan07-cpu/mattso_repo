<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'usuario' => fake()->unique()->userName(),
            'nombre_completo' => fake()->name(),
            'password_hash' => static::$password ??= Hash::make('Una-clave-segura-123'),
            'rol' => User::ROLE_SECRETARY,
            'activo' => true,
        ];
    }
}
