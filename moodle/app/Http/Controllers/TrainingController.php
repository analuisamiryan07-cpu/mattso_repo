<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class TrainingController extends Controller
{
    public function index(): View
    {
        return view('trainings.index');
    }
}
