<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ZipArchive;
use Exception;
use RuntimeException;

class DocumentController extends Controller
{
    private $plantillasMap = [
        'c02' => ['archivo' => 'c02_solicitud.xlsx', 'tipo' => 'xlsx'],
        'c05' => ['archivo' => 'c05_etica.docx', 'tipo' => 'docx'],
        'c08' => ['archivo' => 'c08_asistencia.docx', 'tipo' => 'docx'],
        'c09' => ['archivo' => 'c09_acuerdo.docx', 'tipo' => 'docx'],
        'c10' => ['archivo' => 'c10_notificacion.docx', 'tipo' => 'docx'],
        'c12' => ['archivo' => 'c12_encuesta.xlsx', 'tipo' => 'xlsx'],
    ];

    public function showGenerarForm(Cliente $cliente)
    {
        return view('clientes.generar', compact('cliente'));
    }

    public function generar(Request $request, Cliente $cliente)
    {
        $request->validate([
            'docs' => 'required|array',
            'format' => 'array',
        ]);

        $docsSeleccionados = $request->docs;
        $formatos = $request->format ?? [];

        // Rutas
        $carpetaPlantillas = base_path('plantillas/'); // Usamos las plantillas donde el usuario las dejó localmente
        $carpetaGenerados = storage_path('app/documentos_certificados/');

        if (!file_exists($carpetaGenerados)) {
            mkdir($carpetaGenerados, 0775, true);
        }

        $slug = substr(preg_replace('/[^a-zA-Z0-9]/', '_', $cliente->nombre), 0, 30) . '_' . date('Ymd_His');
        $carpetaSalida = $carpetaGenerados . $slug . '/';
        if (!is_dir($carpetaSalida)) {
            mkdir($carpetaSalida, 0775, true);
        }

        // Preparar Datos para Reemplazar
        $datos = [
            'NOMBRE' => strtoupper($cliente->nombre),
            'CEDULA' => $cliente->cedula ?? '',
            'TELEFONO' => $cliente->telefono ?? '',
            'CORREO' => $cliente->correo ?? '',
            'DIRECCION' => $cliente->direccion ?? '',
            'FECHA' => $this->formatFecha($cliente->fecha->format('Y-m-d')),
            'FECHA_RAW' => $cliente->fecha->format('Y-m-d'),
            'CIUDAD' => $cliente->ciudad ?? '',
            'LUGAR' => strtoupper($cliente->lugar ?? ''),
            'ESQUEMA' => strtoupper($cliente->esquema ?? ''),
            'TIPO_EXAMEN' => $cliente->tipo_examen ?? '',
            'PUNTAJE_PRACTICO' => $cliente->puntaje_practico ?? '',
            
            // ── NUEVAS VARIABLES SMD DADAS POR EL USUARIO ──
            'SMD_nombrecompleto' => strtoupper($cliente->nombre),
            'SMD_cedula' => $cliente->cedula ?? '',
            'SMD_telfono' => $cliente->telefono ?? ($cliente->celular1 ?? ''),
            'SMD_lugarcompleto' => strtoupper($cliente->lugar ?? ''),
            'SMD_fecha' => $this->formatFecha($cliente->fecha->format('Y-m-d')),
            
            // Examinador
            'SMD_nombreexaminadordoc' => strtoupper($cliente->nombre_examinador ?? ''),
            'SMD_cedulaexaminador' => $cliente->cedula_examinador ?? '',
            'SMD_telefonoexaminador' => $cliente->telefono_examinador ?? '',
            
            // Hoja de Vida (CV Metadata JSON)
            'SMD_nombreinstitucion' => strtoupper($cliente->cv_metadata['nombreinstitucion'] ?? ''),
            'SMD_pais_amano' => strtoupper($cliente->cv_metadata['pais_amano'] ?? ''),
            'SMD_ciudad_amano' => strtoupper($cliente->cv_metadata['ciudad_amano'] ?? ''),
            'SMD_tituloobtenido' => strtoupper($cliente->cv_metadata['tituloobtenido'] ?? ''),
            'SMD_curso' => strtoupper($cliente->cv_metadata['curso'] ?? ''),
            'SMD_institucion_curso' => strtoupper($cliente->cv_metadata['institucion_curso'] ?? ''),
            'SMD_fechacurso' => strtoupper($cliente->cv_metadata['fechacurso'] ?? ''),
            'SMD_horas' => strtoupper($cliente->cv_metadata['horas'] ?? ''),
            'SMD_fechadesde' => strtoupper($cliente->cv_metadata['fechadesde'] ?? ''),
            'SMD_fechahasta' => strtoupper($cliente->cv_metadata['fechahasta'] ?? ''),
            'SMD_empresa' => strtoupper($cliente->cv_metadata['empresa'] ?? ''),
            'SMD_cargo' => strtoupper($cliente->cv_metadata['cargo'] ?? ''),
            'SMD_restodedireccion' => strtoupper($cliente->direccion ?? ''),
            'SMD_edad' => $cliente->edad ?? '',
            'SMD_celular1' => $cliente->celular1 ?? '',
        ];

        $archivosGenerados = [];
        $errores = [];

        foreach ($docsSeleccionados as $doc) {
            $docStr = strtolower($doc);
            if (!isset($this->plantillasMap[$docStr])) continue;

            $info = $this->plantillasMap[$docStr];
            $plantilla = $carpetaPlantillas . $info['archivo'];
            $nombreSalida = strtoupper($docStr) . '_' . $slug;
            $formatoDeseado = $formatos[$docStr] ?? 'office'; // pdf o office

            if (!file_exists($plantilla)) {
                $errores[] = "Plantilla no encontrada: {$info['archivo']}. Asegúrate de que exista en /var/www/expansion/plantillas/";
                continue;
            }

            try {
                $rutaGeneradaOffice = $carpetaSalida . $nombreSalida . '.' . $info['tipo'];
                
                // 1. Siempre generar primero el documento Base
                if ($info['tipo'] === 'docx') {
                    $this->generarDocx($plantilla, $rutaGeneradaOffice, $datos);
                } elseif ($info['tipo'] === 'xlsx') {
                    $this->generarXlsx($plantilla, $rutaGeneradaOffice, $datos);
                }

                // 2. ¿Solicitó PDF?
                if ($formatoDeseado === 'pdf') {
                    // Ejecutar LibreOffice en modo fantasma para exportar a PDF en la misma carpeta
                    $comando = "soffice --headless --convert-to pdf " . escapeshellarg($rutaGeneradaOffice) . " --outdir " . escapeshellarg(rtrim($carpetaSalida, '/'));
                    shell_exec($comando);
                    
                    $rutaPdf = $carpetaSalida . $nombreSalida . '.pdf';
                    if (file_exists($rutaPdf)) {
                        $archivosGenerados[] = ['ruta' => $rutaPdf, 'nombre' => basename($rutaPdf)];
                        // Opcional: Eliminar archivo office temporal si se generó bien el PDF
                        @unlink($rutaGeneradaOffice);
                    } else {
                        // Si falló LibreOffice (no instalado, etc), retornamos el Office como respaldo
                        $archivosGenerados[] = ['ruta' => $rutaGeneradaOffice, 'nombre' => basename($rutaGeneradaOffice)];
                        $errores[] = "Fallo al convertir a PDF el doc {$docStr}. Revisa LibreOffice.";
                    }
                } else {
                    $archivosGenerados[] = ['ruta' => $rutaGeneradaOffice, 'nombre' => basename($rutaGeneradaOffice)];
                }

            } catch (Exception $e) {
                $errores[] = "Error procesando {$info['archivo']}: " . $e->getMessage();
            }
        }

        if (empty($archivosGenerados)) {
            return back()->with('error', 'No se generó ningún documento. ' . implode(', ', $errores));
        }

        // Empaquetar y Enviar
        $zipPath = $carpetaSalida . 'Certificados_' . $slug . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($archivosGenerados as $a) {
                $zip->addFile($a['ruta'], $a['nombre']);
            }
            if (!empty($errores)) {
                $zip->addFromString('errores.txt', implode("\n", $errores));
            }
            $zip->close();
            
            return response()->download($zipPath)->deleteFileAfterSend(false);
        }

        return back()->with('error', 'No se pudo crear el archivo ZIP.');
    }

    private function formatFecha($f)
    {
        if (!$f) return '';
        $meses = [1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril', 5 => 'mayo', 6 => 'junio',
            7 => 'julio', 8 => 'agosto', 9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre'];
        [$y, $m, $d] = explode('-', $f);
        return (int)$d . ' de ' . $meses[(int)$m] . ' ' . $y;
    }

    private function reemplazarMarcadores(string $contenido, array $datos): string
    {
        foreach ($datos as $clave => $valor) {
            $busquedas = [
                '${' . $clave . '}', 
                '{{' . $clave . '}}',
                $clave
            ];
            $valorSeguro = htmlspecialchars((string)$valor, ENT_XML1);
            $reemplazos = array_fill(0, count($busquedas), $valorSeguro);
            
            $contenido = str_replace($busquedas, $reemplazos, $contenido);
        }
        return $contenido;
    }

    private function generarDocx(string $plantilla, string $salida, array $datos): void
    {
        $zip = new ZipArchive();
        if ($zip->open($plantilla) !== true) throw new RuntimeException("No open $plantilla");

        $xmlTargets = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $nombre = $zip->getNameIndex($i);
            if (str_ends_with($nombre, '.xml') || str_ends_with($nombre, '.rels')) {
                $xmlTargets[] = $nombre;
            }
        }

        $tmpZip = $salida . '.tmp.docx';
        copy($plantilla, $tmpZip);
        $zipSalida = new ZipArchive();
        if ($zipSalida->open($tmpZip) !== true) throw new RuntimeException("No open tmp");

        foreach ($xmlTargets as $xmlFile) {
            $contenido = $zip->getFromName($xmlFile);
            if ($contenido === false) continue;
            
            $nuevo = $this->reemplazarMarcadores($contenido, $datos);
            if ($nuevo !== $contenido) $zipSalida->addFromString($xmlFile, $nuevo);
        }

        $zip->close();
        $zipSalida->close();
        rename($tmpZip, $salida);
    }

    private function generarXlsx(string $plantilla, string $salida, array $datos): void
    {
        $spreadsheet = IOFactory::load($plantilla);
        foreach ($spreadsheet->getAllSheets() as $hoja) {
            foreach ($hoja->getRowIterator() as $fila) {
                $celdas = $fila->getCellIterator();
                $celdas->setIterateOnlyExistingCells(true);
                foreach ($celdas as $celda) {
                    $val = (string)$celda->getValue();
                    if (str_contains($val, '${') || str_contains($val, '{{') || str_contains($val, 'SMD_')) {
                        foreach ($datos as $clave => $valor) {
                            $val = str_replace(['${' . $clave . '}', '{{' . $clave . '}}', $clave], $valor, $val);
                        }
                        $celda->setValue($val);
                    }
                }
            }
        }
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($salida);
    }
}
