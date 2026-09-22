<?php

return [
    /*
     | Clave AES-256 para cifrar IPs.
     | Definir en .env: ASISTENCIA_IP_KEY=cadena_aleatoria_segura
     */
    'ip_key' => env('ASISTENCIA_IP_KEY'),

    /*
     | Primeros 3 octetos de la subred de la empresa.
     | El servidor rechaza marcaciones que no vengan de esta subred.
     | Definir en .env si difiere: ASISTENCIA_RED_EMPRESA=192.168.1
     */
    'red_empresa' => env('ASISTENCIA_RED_EMPRESA', '192.168.100'),
];
