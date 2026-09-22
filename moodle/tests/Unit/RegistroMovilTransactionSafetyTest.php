<?php

namespace Tests\Unit;

use Tests\TestCase;

/**
 * Safety tests verifying that mobile registration is wrapped in a
 * database transaction, preventing partial user/empleado/horario/token
 * creation if any step fails.
 */
class RegistroMovilTransactionSafetyTest extends TestCase
{
    public function test_registrar_method_uses_db_transaction(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/AsistenciaApiController.php')
        );

        $this->assertIsString($source);

        // Must use DB::transaction
        $this->assertStringContainsString('DB::transaction', $source,
            'registrar() must wrap the four creates in DB::transaction()');

        // Must import the DB facade
        $this->assertStringContainsString(
            'use Illuminate\Support\Facades\DB;', $source,
            'The DB facade must be imported');
    }

    public function test_all_four_creates_are_inside_the_transaction_closure(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/AsistenciaApiController.php')
        );

        // Extract the registrar method body
        $start = strpos($source, 'public function registrar(');
        $this->assertNotFalse($start, 'registrar() method must exist');

        // Find the transaction block
        $txStart = strpos($source, 'DB::transaction(function', $start);
        $this->assertNotFalse($txStart, 'DB::transaction must be inside registrar()');

        // Find the end of the registrar method (next public function or end of class)
        $nextMethod = strpos($source, 'public function login(', $txStart);
        $this->assertNotFalse($nextMethod, 'login() method must follow registrar()');

        // The transaction block is between $txStart and $nextMethod
        $txBlock = substr($source, $txStart, $nextMethod - $txStart);

        // All four model creates must be inside the transaction
        $this->assertStringContainsString('User::create', $txBlock,
            'User::create must be inside the transaction');
        $this->assertStringContainsString('Empleado::create', $txBlock,
            'Empleado::create must be inside the transaction');
        $this->assertStringContainsString('Horario::create', $txBlock,
            'Horario::create must be inside the transaction');
        $this->assertStringContainsString('TokenMovil::create', $txBlock,
            'TokenMovil::create must be inside the transaction');
    }

    public function test_transaction_returns_user_and_token_for_response(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/AsistenciaApiController.php')
        );

        // The transaction must return the values needed for the response
        $txStart = strpos($source, 'DB::transaction(function');
        $nextMethod = strpos($source, 'public function login(', $txStart);
        $txBlock = substr($source, $txStart, $nextMethod - $txStart);

        $this->assertStringContainsString('return [$user, $token]', $txBlock,
            'Transaction must return [$user, $token] for the response');
    }

    public function test_response_contract_unchanged(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/AsistenciaApiController.php')
        );

        // Extract registrar method
        $start = strpos($source, 'public function registrar(');
        $nextMethod = strpos($source, 'public function login(');
        $method = substr($source, $start, $nextMethod - $start);

        // The response must still include token and nombre with 201 status
        $this->assertStringContainsString("'token'  => \$token", $method,
            'Response must include the token field');
        $this->assertStringContainsString("'nombre' => \$user->nombre_completo", $method,
            'Response must include the nombre field');
        $this->assertStringContainsString('201', $method,
            'Response must return HTTP 201');
    }

    public function test_no_creates_exist_outside_transaction_in_registrar(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/AsistenciaApiController.php')
        );

        // Extract registrar method body
        $start = strpos($source, 'public function registrar(');
        $nextMethod = strpos($source, 'public function login(');
        $method = substr($source, $start, $nextMethod - $start);

        // Find transaction boundaries in the method
        $txStart = strpos($method, 'DB::transaction(function');
        $txEnd   = strpos($method, '});', $txStart);
        $this->assertNotFalse($txStart);
        $this->assertNotFalse($txEnd);

        // Code before transaction (validation + duplicate check)
        $beforeTx = substr($method, 0, $txStart);
        // Code after transaction (response)
        $afterTx = substr($method, $txEnd + 3);

        // No model creates should be outside the transaction
        $this->assertStringNotContainsString('User::create', $beforeTx,
            'User::create must not be before the transaction');
        $this->assertStringNotContainsString('User::create', $afterTx,
            'User::create must not be after the transaction');
        $this->assertStringNotContainsString('Empleado::create', $beforeTx . $afterTx,
            'Empleado::create must not be outside the transaction');
        $this->assertStringNotContainsString('Horario::create', $beforeTx . $afterTx,
            'Horario::create must not be outside the transaction');
        $this->assertStringNotContainsString('TokenMovil::create', $beforeTx . $afterTx,
            'TokenMovil::create must not be outside the transaction');
    }
}
