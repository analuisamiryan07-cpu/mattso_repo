<?php
/**
 * generar.php — Motor de generación de documentos de certificación
 * SAPPERPROTECTION CIA LTDA
 *
 * Para DOCX: reemplaza marcadores ${VAR} directamente en el XML interno del ZIP.
 * Para XLSX: usa PhpSpreadsheet para reemplazar marcadores ${VAR} en las celdas.
 *
 * Las plantillas deben estar en /plantillas/ con marcadores ${CAMPO}.
 */

// ── Dependencias ────────────────────────────────────────────────────────────
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    header('Location: index.php?error=' . urlencode('Ejecuta: composer install'));
    exit;
}
require_once $autoload;

use PhpOffice\PhpSpreadsheet\IOFactory;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

// ── Datos del formulario ────────────────────────────────────────────────────
function campo(string $k): string
{
    return trim($_POST[$k] ?? '');
}

function formatFecha(string $f): string
{
    if (!$f)
        return '';
    $meses = [1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril', 5 => 'mayo', 6 => 'junio',
        7 => 'julio', 8 => 'agosto', 9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre'];
    [$y, $m, $d] = explode('-', $f);
    return (int)$d . ' de ' . $meses[(int)$m] . ' ' . $y;
}

$datos = [
    'NOMBRE' => strtoupper(campo('nombre')),
    'CEDULA' => campo('cedula'),
    'TELEFONO' => campo('telefono'),
    'CORREO' => campo('correo'),
    'DIRECCION' => campo('direccion'),
    'FECHA' => formatFecha(campo('fecha')),
    'FECHA_RAW' => campo('fecha'),
    'CIUDAD' => campo('ciudad'),
    'LUGAR' => strtoupper(campo('lugar')),
    'ESQUEMA' => strtoupper(campo('esquema')),
    'TIPO_EXAMEN' => campo('tipo_examen'),
    'PUNTAJE_TEORICO' => campo('puntaje_teorico'),
    'PUNTAJE_PRACTICO' => campo('puntaje_practico'),
];

$docsSeleccionados = $_POST['docs'] ?? [];
$carpetaPlantillas = __DIR__ . '/plantillas/';
$carpetaGenerados = __DIR__ . '/generados/';

// FIX [PathTraversal]: Definir lista blanca de documentos permitidos antes de usar los datos
$ALLOWED_DOCS = ['c02', 'c05', 'c08', 'c09', 'c10', 'c12'];
$docsSeleccionados = array_filter(
    array_map('strtolower', (array)$docsSeleccionados),
    fn($d) => in_array($d, $ALLOWED_DOCS, true)
);

// --- GUARDAR EN BASE DE DATOS LOCAL ---
require_once __DIR__ . '/includes/db.php';
$clienteId = null;

try {
    // Buscar si la cédula ya existe
    $stmt = $pdo->prepare("SELECT id FROM public.clientes WHERE cedula = ?");
    $stmt->execute([$datos['CEDULA']]);
    $row = $stmt->fetch();
    
    if ($row) {
        $clienteId = $row['id'];
        // Actualizar datos
        $upd = $pdo->prepare("UPDATE public.clientes SET 
            nombre = ?, telefono = ?, correo = ?, direccion = ?, fecha = ?, ciudad = ?, lugar = ?, esquema = ?, tipo_examen = ?, puntaje_teorico = ?, puntaje_practico = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?");
        $upd->execute([
            $datos['NOMBRE'], $datos['TELEFONO'], $datos['CORREO'], $datos['DIRECCION'], 
            $datos['FECHA_RAW'] ?: null, $datos['CIUDAD'], $datos['LUGAR'], $datos['ESQUEMA'], 
            $datos['TIPO_EXAMEN'], $datos['PUNTAJE_TEORICO'], $datos['PUNTAJE_PRACTICO'], 
            $clienteId
        ]);
    } else {
        // Insertar nuevo cliente
        $ins = $pdo->prepare("INSERT INTO public.clientes 
            (nombre, cedula, telefono, correo, direccion, fecha, ciudad, lugar, esquema, tipo_examen, puntaje_teorico, puntaje_practico, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id");
        $ins->execute([
            $datos['NOMBRE'], $datos['CEDULA'], $datos['TELEFONO'], $datos['CORREO'], $datos['DIRECCION'], 
            $datos['FECHA_RAW'] ?: null, $datos['CIUDAD'], $datos['LUGAR'], $datos['ESQUEMA'], 
            $datos['TIPO_EXAMEN'], $datos['PUNTAJE_TEORICO'], $datos['PUNTAJE_PRACTICO']
        ]);
        $clienteId = $ins->fetchColumn();
    }
} catch (PDOException $e) {
    // FIX [HTTP Response Splitting]: eliminar \r\n del mensaje antes de inyectarlo en Location
    $errMsg = str_replace(["\r", "\n"], '', $e->getMessage());
    header('Location: index.php?error=' . urlencode('Error BD: ' . $errMsg));
    exit;
}
// --------------------------------------
$carpetaGenerados = __DIR__ . '/generados/';

$slug = substr(preg_replace('/[^a-zA-Z0-9]/', '_', $datos['NOMBRE']), 0, 30) . '_' . date('Ymd_His');
$carpetaSalida = $carpetaGenerados . $slug . '/';
if (!is_dir($carpetaSalida))
    mkdir($carpetaSalida, 0755, true);

$plantillasMap = [
    'c02' => ['archivo' => 'c02_solicitud.xlsx', 'tipo' => 'xlsx'],
    'c05' => ['archivo' => 'c05_etica.docx', 'tipo' => 'docx'],
    'c08' => ['archivo' => 'c08_asistencia.docx', 'tipo' => 'docx'],
    'c09' => ['archivo' => 'c09_acuerdo.docx', 'tipo' => 'docx'],
    'c10' => ['archivo' => 'c10_notificacion.docx', 'tipo' => 'docx'],
    'c12' => ['archivo' => 'c12_encuesta.xlsx', 'tipo' => 'xlsx'],
];

// ── Función: reemplazar marcadores ${VAR} en una cadena ─────────────────────
function reemplazarMarcadores(string $contenido, array $datos): string
{
    foreach ($datos as $clave => $valor) {
        // PHPWord usa ${VAR}, también cubrimos {{VAR}} por si acaso
        $contenido = str_replace(
        ['${' . $clave . '}', '{{' . $clave . '}}'],
        [htmlspecialchars($valor, ENT_XML1), htmlspecialchars($valor, ENT_XML1)],
            $contenido
        );
    }
    return $contenido;
}

// ── Función: generar DOCX reemplazando XML directamente en el ZIP ────────────
function generarDocx(string $plantilla, string $salida, array $datos): void
{
    $zip = new ZipArchive();
    if ($zip->open($plantilla) !== true) {
        throw new RuntimeException("No se pudo abrir: $plantilla");
    }

    // Archivos XML dentro del DOCX que pueden contener los marcadores
    $xmlTargets = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $nombre = $zip->getNameIndex($i);
        if (str_ends_with($nombre, '.xml') || str_ends_with($nombre, '.rels')) {
            $xmlTargets[] = $nombre;
        }
    }

    // Guardar copia temporal con reemplazos
    $tmpZip = $salida . '.tmp.docx';
    copy($plantilla, $tmpZip);

    $zipSalida = new ZipArchive();
    $zipSalida->open($tmpZip);

    foreach ($xmlTargets as $xmlFile) {
        $contenido = $zip->getFromName($xmlFile);
        if ($contenido === false)
            continue;

        // PHPWord puede haber fragmentado ${NOMBRE} en varios <w:r>:
        // primero intentamos fixear el XML uniendo runs consecutivos con el mismo estilo
        // y luego hacemos el reemplazo
        $nuevo = reemplazarMarcadores($contenido, $datos);
        if ($nuevo !== $contenido) {
            $zipSalida->addFromString($xmlFile, $nuevo);
        }
    }

    $zip->close();
    $zipSalida->close();
    rename($tmpZip, $salida);
}

// ── Función: generar XLSX con PhpSpreadsheet ─────────────────────────────────
function generarXlsx(string $plantilla, string $salida, array $datos): void
{
    $spreadsheet = IOFactory::load($plantilla);

    foreach ($spreadsheet->getAllSheets() as $hoja) {
        foreach ($hoja->getRowIterator() as $fila) {
            $celdas = $fila->getCellIterator();
            $celdas->setIterateOnlyExistingCells(true);
            foreach ($celdas as $celda) {
                $val = (string)$celda->getValue();
                if (str_contains($val, '${') || str_contains($val, '{{')) {
                    foreach ($datos as $clave => $valor) {
                        $val = str_replace(['${' . $clave . '}', '{{' . $clave . '}}'], $valor, $val);
                    }
                    $celda->setValue($val);
                }
            }
        }
    }

    $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
    $writer->save($salida);
}

// ── Procesar documentos seleccionados ────────────────────────────────────────
$archivosGenerados = [];
$errores = [];

foreach ($docsSeleccionados as $doc) {
    $doc = strtolower($doc);
    if (!isset($plantillasMap[$doc]))
        continue;

    $info = $plantillasMap[$doc];
    $plantilla = $carpetaPlantillas . $info['archivo'];

    $nombreSalida = strtoupper($doc) . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', $datos['NOMBRE'])
        . '_' . $datos['FECHA_RAW'];

    if (!file_exists($plantilla)) {
        $errores[] = "Plantilla no encontrada: {$info['archivo']}";
        continue;
    }

    try {
        if ($info['tipo'] === 'docx') {
            $ruta = $carpetaSalida . $nombreSalida . '.docx';
            generarDocx($plantilla, $ruta, $datos);
            $archivosGenerados[] = ['ruta' => $ruta, 'nombre' => basename($ruta)];

        }
        elseif ($info['tipo'] === 'xlsx') {
            $ruta = $carpetaSalida . $nombreSalida . '.xlsx';
            generarXlsx($plantilla, $ruta, $datos);
            $archivosGenerados[] = ['ruta' => $ruta, 'nombre' => basename($ruta)];
        }
    }
    catch (Exception $e) {
        $errores[] = "Error en {$info['archivo']}: " . $e->getMessage();
    }
}

// ── Empaquetar en ZIP y descargar ────────────────────────────────────────────
if (empty($archivosGenerados)) {
    $msg = !empty($errores) ? implode('; ', $errores) : 'No se generó ningún documento';
    // FIX [HTTP Response Splitting]: eliminar \r\n del mensaje antes de inyectarlo en Location
    $msg = str_replace(["\r", "\n"], '', $msg);
    header('Location: index.php?error=' . urlencode($msg));
    exit;
}

$zipPath = $carpetaSalida . 'certificacion_' . $slug . '.zip';
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
    $nombres_archivos = [];
    foreach ($archivosGenerados as $a) {
        $zip->addFile($a['ruta'], $a['nombre']);
        $nombres_archivos[] = $a['nombre'];
    }
    $zip->close();
    
    // Registrar la generación en la BD
    session_start();
    $usuarioGenerador = $_SESSION['usuario'] ?? 'desconocido';
    try {
        $stmtDoc = $pdo->prepare("INSERT INTO public.documentos_generados 
            (cliente_id, carpeta, zip_ruta, n_archivos, nombres_archivos, generado_por) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $stmtDoc->execute([
            $clienteId, 
            basename($carpetaSalida), 
            basename($zipPath), 
            count($archivosGenerados), 
            json_encode($nombres_archivos),
            $usuarioGenerador
        ]);
    } catch (PDOException $e) {
        // Log o manejar error de BD si es necesario
    }

    header('Content-Type: application/zip');
    // FIX [Reflected XSS + HTTP Response Splitting]: sanitizar nombre en Content-Disposition
    $safeNombre = preg_replace('/[^\w\s\-]/', '_', $datos['NOMBRE']);
    header('Content-Disposition: attachment; filename="Certificacion_' . $safeNombre . '.zip"');
    header('Content-Length: ' . filesize($zipPath));
    readfile($zipPath);
    exit;
}

header('Location: index.php?ok=1');
exit;