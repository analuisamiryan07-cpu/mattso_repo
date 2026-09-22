<?php

namespace Tests\Feature;

use App\Http\Controllers\DashboardController;
use App\Services\CatalogApiService;
use App\Services\PaymentApiService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\RequiresPhpExtension;
use Tests\TestCase;

#[RequiresPhpExtension('pdo_sqlite')]
class DashboardLocalMetricsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('clientes', function (Blueprint $table): void {
            $table->id();
        });
        Schema::create('documentos_generados', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('cliente_id');
        });
        Schema::create('usuarios_admin', function (Blueprint $table): void {
            $table->id();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('documentos_generados');
        Schema::dropIfExists('clientes');
        Schema::dropIfExists('usuarios_admin');

        parent::tearDown();
    }

    public function test_dashboard_separates_document_candidates_from_records_without_documents(): void
    {
        DB::table('clientes')->insert([
            ['id' => 1],
            ['id' => 2],
            ['id' => 3],
        ]);
        DB::table('documentos_generados')->insert([
            ['id' => 10, 'cliente_id' => 1],
            ['id' => 11, 'cliente_id' => 1],
            ['id' => 12, 'cliente_id' => 2],
        ]);

        $catalog = $this->createMock(CatalogApiService::class);
        $catalog->method('getWebUsers')->willReturn(['meta' => ['total' => 0]]);
        $catalog->method('getAll')->willReturn([]);

        $payments = $this->createMock(PaymentApiService::class);
        $payments->method('orders')->willReturn([]);

        $view = (new DashboardController($catalog, $payments))->admin();
        $data = $view->getData();

        $this->assertSame(2, $data['documentClientCount']);
        $this->assertSame(1, $data['clientRecordsWithoutDocuments']);
        $this->assertArrayNotHasKey('clientCount', $data);
    }
}
