<?php
require __DIR__.'/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$file = "C:\\Users\\melan\\Documents\\MATTSO\\proyecto_matt\\plantillas\\esquemas y examinadores (1).xls";
$spreadsheet = IOFactory::load($file);

$data = [];
foreach ($spreadsheet->getAllSheets() as $sheet) {
    $sheetTitle = $sheet->getTitle();
    $data[$sheetTitle] = $sheet->toArray(null, true, true, true);
}

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
