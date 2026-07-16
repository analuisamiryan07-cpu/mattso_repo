<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdministrator() === true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'usuario' => ['required', 'string', 'max:100', Rule::unique('usuarios_admin', 'usuario')],
            'rol' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_SECRETARY])],
            'contrasena' => ['required', 'string', 'min:10', 'confirmed'],
        ];
    }
}
