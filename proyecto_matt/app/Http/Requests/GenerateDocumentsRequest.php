<?php

namespace App\Http\Requests;

use App\Support\CertificationCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GenerateDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $applications = array_values(array_filter((array) $this->input('aplicaciones', []), 'is_array'));
        $this->merge([
            'aplicaciones' => $applications,
            'esquema' => $applications[0]['esquema'] ?? $this->input('esquema'),
        ]);
    }

    public function rules(): array
    {
        $isC02 = in_array('c02', (array) $this->input('docs', []), true);
        $isC08 = in_array('c08', (array) $this->input('docs', []), true);
        $documents = (array) $this->input('docs', []);
        $needsLocation = count(array_intersect($documents, ['c02', 'c08', 'c09', 'c10', 'c12'])) > 0;
        $needsExamAddress = count(array_intersect($documents, ['c02', 'c08', 'c09', 'c12'])) > 0;
        $catalog = app(CertificationCatalog::class);
        $province = (string) $this->input('provincia');

        return [
            'nombre' => ['required', 'string', 'max:180'],
            'cedula' => ['required', 'string', 'max:20'],
            'telefono' => ['nullable', 'regex:/^\d{1,10}$/'],
            'celular' => [Rule::requiredIf($isC02 || $isC08), 'nullable', 'regex:/^\d{1,10}$/'],
            'correo' => ['nullable', 'email', 'max:180'],
            'edad' => [Rule::requiredIf($isC02), 'nullable', 'integer', 'between:1,120'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'fecha' => ['required', 'date_format:Y-m-d'],
            'fecha_c02' => [Rule::requiredIf($isC02), 'nullable', 'date_format:Y-m-d'],
            'provincia' => [Rule::requiredIf($needsLocation), 'nullable', Rule::in(array_keys(config('c02.locations')))],
            'ciudad' => [Rule::requiredIf($needsLocation), 'nullable', Rule::in(config("c02.locations.{$province}", []))],
            'lugar' => ['required', 'string', 'max:180'],
            'esquema' => ['required', Rule::in($catalog->schemeNames())],
            'tipo_examen' => ['required', Rule::in(['TEÓRICA', 'PRÁCTICA', 'TEÓRICA Y PRÁCTICA'])],
            'puntaje_teorico' => ['nullable', 'string', 'max:30'],
            'puntaje_practico' => ['nullable', 'string', 'max:30'],
            'secuencia_codigo' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:30'],
            'examinador_id' => [Rule::requiredIf($isC08), 'nullable', Rule::in($catalog->examinerIds())],

            'aplicaciones' => ['required', 'array', 'min:1', 'max:10'],
            'aplicaciones.*.perfil' => ['required', Rule::in($catalog->profileNames())],
            'aplicaciones.*.esquema' => ['required', Rule::in($catalog->schemeNames())],
            'aplicaciones.*.unidades' => [Rule::requiredIf($isC02), 'nullable', 'array', 'min:1', 'max:5'],
            'aplicaciones.*.unidades.*' => ['integer', Rule::in([1, 2, 3, 4, 5]), 'distinct'],

            'instalaciones' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:180'],
            'direccion_instalacion' => [Rule::requiredIf($needsExamAddress), 'nullable', 'string', 'max:255'],
            'sector_instalacion' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:120'],
            'telefono_instalacion' => [Rule::requiredIf($isC02), 'nullable', 'regex:/^\d{1,10}$/'],

            'educaciones' => [Rule::requiredIf($isC02), 'nullable', 'array'],
            'educaciones.*.seleccionado' => ['required', 'boolean'],
            'educaciones.*.institucion' => ['nullable', 'string', 'max:180'],
            'educaciones.*.pais' => ['nullable', 'string', 'max:100'],
            'educaciones.*.ciudad' => ['nullable', 'string', 'max:120'],
            'educaciones.*.titulo' => ['nullable', 'string', 'max:180'],

            'capacitaciones' => [Rule::requiredIf($isC02), 'nullable', 'array', 'min:1', 'max:20'],
            'capacitaciones.*.curso' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:180'],
            'capacitaciones.*.institucion' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:180'],
            'capacitaciones.*.fecha' => [Rule::requiredIf($isC02), 'nullable', 'date_format:Y-m-d'],
            'capacitaciones.*.horas' => [Rule::requiredIf($isC02), 'nullable', 'integer', 'min:1', 'max:99999'],

            'experiencias' => [Rule::requiredIf($isC02), 'nullable', 'array', 'min:1', 'max:20'],
            'experiencias.*.fecha_desde' => [Rule::requiredIf($isC02), 'nullable', 'date_format:Y-m-d'],
            'experiencias.*.fecha_hasta' => [Rule::requiredIf($isC02), 'nullable', 'date_format:Y-m-d', 'after_or_equal:experiencias.*.fecha_desde'],
            'experiencias.*.empresa' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:180'],
            'experiencias.*.ciudad' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:180'],
            'experiencias.*.telefono' => [Rule::requiredIf($isC02), 'nullable', 'regex:/^\d{1,10}$/'],
            'experiencias.*.funcion' => [Rule::requiredIf($isC02), 'nullable', 'string', 'max:255'],

            'docs' => ['required', 'array', 'min:1'],
            'docs.*' => [Rule::in(['c02', 'c05', 'c08', 'c09', 'c10', 'c12'])],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! in_array('c02', (array) $this->input('docs', []), true)) {
                return;
            }

            $selected = collect((array) $this->input('educaciones'))
                ->filter(fn ($education): bool => (bool) ($education['seleccionado'] ?? false));
            if ($selected->isEmpty()) {
                $validator->errors()->add('educaciones', 'Selecciona al menos un nivel de educación.');
            }

            foreach ($selected as $level => $education) {
                foreach (['institucion', 'pais', 'ciudad', 'titulo'] as $field) {
                    if (blank($education[$field] ?? null)) {
                        $validator->errors()->add("educaciones.{$level}.{$field}", 'Completa todos los datos del nivel de educación seleccionado.');
                    }
                }
            }

        }];
    }

    public function attributes(): array
    {
        return [
            'telefono' => 'teléfono de casa',
            'celular' => 'celular personal',
            'secuencia_codigo' => 'secuencia del código',
            'fecha_c02' => 'fecha exclusiva del C02',
            'examinador_id' => 'examinador',
            'aplicaciones.*.unidades' => 'unidades de competencia',
            'telefono_instalacion' => 'teléfono de las instalaciones',
            'experiencias.*.fecha_desde' => 'fecha desde',
            'experiencias.*.fecha_hasta' => 'fecha hasta',
        ];
    }
}
