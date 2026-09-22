<?php

namespace App\Http\Controllers;

use App\Services\CatalogApiService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class WebClientController extends Controller
{
    public function __construct(private CatalogApiService $api) {}

    public function index(Request $request): View
    {
        $page   = max(1, (int) $request->integer('page', 1));
        $search = mb_substr(trim($request->string('buscar')->toString()), 0, 100);

        try {
            $result = $this->api->getWebUsers($page, $search);
            $users  = $result['data'] ?? [];
            $meta   = $result['meta'] ?? ['total' => 0, 'page' => 1, 'limit' => 25, 'pages' => 1];
            $error  = null;
        } catch (\Exception $e) {
            $users = [];
            $meta  = ['total' => 0, 'page' => 1, 'limit' => 25, 'pages' => 1];
            $error = 'No se pudo conectar con el servidor web: '.$e->getMessage();
        }

        return view('clients.web', compact('users', 'meta', 'search', 'error'));
    }
}
