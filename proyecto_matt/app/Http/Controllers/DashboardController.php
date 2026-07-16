<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\GeneratedDocument;
use App\Models\User;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function admin(): View
    {
        return view('dashboard.admin', [
            'clientCount' => Client::query()->count(),
            'documentCount' => GeneratedDocument::query()->count(),
            'userCount' => User::query()->count(),
        ]);
    }

    public function secretary(): View
    {
        return view('dashboard.secretary');
    }
}
