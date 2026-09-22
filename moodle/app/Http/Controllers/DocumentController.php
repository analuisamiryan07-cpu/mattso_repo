<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateDocumentsRequest;
use App\Services\DocumentGenerationService;
use App\Support\CertificationCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class DocumentController extends Controller
{
    public function create(): View
    {
        $catalog = new CertificationCatalog('SAPPER');
        $matssoCatalog = new CertificationCatalog('MATSSO');
        $fumaluCatalog = new CertificationCatalog('FUMALU');

        return view('documents.create', [
            'documents' => DocumentGenerationService::templates('SAPPER'),
            'schemes' => $catalog->schemes(),
            'profiles' => $catalog->profileNames(),
            'examiners' => $catalog->examiners(),
            'companyCatalogs' => [
                'SAPPER' => [
                    'schemes' => $catalog->schemes(),
                    'examiners' => $catalog->examiners(),
                    'documents' => DocumentGenerationService::templates('SAPPER'),
                ],
                'MATSSO' => [
                    'schemes' => $matssoCatalog->schemes(),
                    'examiners' => $matssoCatalog->examiners(),
                    'documents' => DocumentGenerationService::templates('MATSSO'),
                ],
                'FUMALU' => [
                    'schemes' => $fumaluCatalog->schemes(),
                    'examiners' => $fumaluCatalog->examiners(),
                    'documents' => DocumentGenerationService::templates('FUMALU'),
                ],
            ],
            'locations' => config('c02.locations'),
            'educationLevels' => config('c02.education_levels'),
        ]);
    }

    public function store(
        GenerateDocumentsRequest $request,
        DocumentGenerationService $service,
    ): RedirectResponse {
        $result = $service->generate($request->validated(), $request->user());

        return redirect()
            ->route('clients.index')
            ->with('download_id', $result['document_id'])
            ->with('status', 'Documentos generados correctamente. La descarga iniciará en un momento.');
    }
}
