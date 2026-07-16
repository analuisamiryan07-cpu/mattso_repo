<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateDocumentsRequest;
use App\Services\DocumentGenerationService;
use App\Support\CertificationCatalog;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentController extends Controller
{
    public function create(CertificationCatalog $catalog): View
    {
        return view('documents.create', [
            'documents' => DocumentGenerationService::templates(),
            'schemes' => $catalog->schemes(),
            'profiles' => $catalog->profileNames(),
            'examiners' => $catalog->examiners(),
            'locations' => config('c02.locations'),
            'educationLevels' => config('c02.education_levels'),
        ]);
    }

    public function store(
        GenerateDocumentsRequest $request,
        DocumentGenerationService $service,
    ): BinaryFileResponse {
        $result = $service->generate($request->validated(), $request->user());

        return response()->download($result['path'], $result['download_name']);
    }
}
