<?php

return [
    'template_path'   => env('DOCUMENT_TEMPLATE_PATH') ?: resource_path('document-templates'),
    'generated_path'  => env('GENERATED_DOCUMENTS_PATH') ?: storage_path('app/private/generated'),
    'backend_url'     => rtrim((string) env('BACKEND_URL', 'http://localhost:3000'), '/'),
    'admin_api_key'   => env('ADMIN_API_KEY'),
    // Clave M2M exclusiva del LMS (Aula Virtual) — distinta de admin_api_key
    // a propósito. Ver Moodles/lms/docs/REQUISITOS_SISTEMA_INTERNO.md §1.
    'lms_m2m_api_key' => env('LMS_M2M_API_KEY'),
    'brevo_api_key'   => env('BREVO_API_KEY'),
    'brevo_sender_email' => env('BREVO_SENDER_EMAIL', 'notificaciones.matsso@gmail.com'),
    'frontend_url'    => rtrim((string) env('MATSSO_FRONTEND_URL', 'https://matsso.vercel.app'), '/'),
];
