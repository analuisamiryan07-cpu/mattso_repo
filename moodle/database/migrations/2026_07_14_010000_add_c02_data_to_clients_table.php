<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('clientes') && ! Schema::hasColumn('clientes', 'datos_c02')) {
            Schema::table('clientes', function (Blueprint $table): void {
                $table->json('datos_c02')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clientes') && Schema::hasColumn('clientes', 'datos_c02')) {
            Schema::table('clientes', function (Blueprint $table): void {
                $table->dropColumn('datos_c02');
            });
        }
    }
};
