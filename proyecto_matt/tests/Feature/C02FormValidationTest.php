<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class C02FormValidationTest extends TestCase
{
    public function test_form_uses_the_scheme_catalog_and_province_options(): void
    {
        $this->actingAs($this->user())
            ->get('/documentos/nuevo')
            ->assertOk()
            ->assertSee('Pichincha')
            ->assertSee('Defensa y Protección')
            ->assertSee('Alava Macias Fatima Esperanza')
            ->assertSee('Oña Calderon Carlos Paul')
            ->assertSee('Educación formal')
            ->assertSee('Lectoescritura (C03) cuando aplique')
            ->assertSee('Agregar capacitación')
            ->assertSee('Agregar experiencia');
    }

    public function test_c02_rejects_long_phones_and_a_city_from_another_province(): void
    {
        $payload = $this->validPayload();
        $payload['telefono'] = '12345678901';
        $payload['celular'] = '12345678901';
        $payload['telefono_instalacion'] = '12345678901';
        $payload['provincia'] = 'Pichincha';
        $payload['ciudad'] = 'Guayaquil';

        $this->actingAs($this->user())
            ->post('/documentos', $payload)
            ->assertSessionHasErrors(['telefono', 'celular', 'telefono_instalacion', 'ciudad'])
            ->assertSessionDoesntHaveErrors(['aplicaciones.0.perfil', 'aplicaciones.0.esquema']);
    }

    private function user(): User
    {
        $user = new User(['usuario' => 'secretaria', 'rol' => User::ROLE_SECRETARY, 'activo' => true]);
        $user->id = 10;

        return $user;
    }

    private function validPayload(): array
    {
        return [
            'docs' => ['c02'],
            'nombre' => 'Persona de prueba',
            'cedula' => '1712345678',
            'telefono' => '022345678',
            'celular' => '0987654321',
            'correo' => 'persona@example.test',
            'edad' => 35,
            'direccion' => 'Av. de prueba',
            'fecha' => '2026-07-14',
            'fecha_c02' => '2026-07-15',
            'provincia' => 'Pichincha',
            'ciudad' => 'Quito',
            'lugar' => 'Sede Quito',
            'tipo_examen' => 'TEÓRICA',
            'secuencia_codigo' => '001-2026',
            'aplicaciones' => [[
                'perfil' => 'Cuidado de Personas Adultas Mayores',
                'esquema' => 'Defensa y Protección',
                'unidades' => [1],
            ]],
            'instalaciones' => 'Centro de evaluación',
            'direccion_instalacion' => 'Calle principal',
            'sector_instalacion' => 'Norte',
            'telefono_instalacion' => '022222222',
            'educaciones' => [
                'secundaria' => ['seleccionado' => 1, 'institucion' => 'Colegio', 'pais' => 'Ecuador', 'ciudad' => 'Quito', 'titulo' => 'Bachiller'],
            ],
            'capacitaciones' => [['curso' => 'Curso', 'institucion' => 'Instituto', 'fecha' => '2026-01-01', 'horas' => 40]],
            'experiencias' => [['fecha_desde' => '2025-01-01', 'fecha_hasta' => '2025-12-31', 'empresa' => 'Empresa', 'ciudad' => 'Quito', 'telefono' => '0999999999', 'funcion' => 'Técnico']],
        ];
    }
}
