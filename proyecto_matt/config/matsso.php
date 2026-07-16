<?php

return [
    'template_path' => env('DOCUMENT_TEMPLATE_PATH') ?: resource_path('document-templates'),
    'backend_url' => rtrim((string) env('BACKEND_URL', 'http://localhost:3000'), '/'),
    'admin_api_key' => env('ADMIN_API_KEY'),
];
