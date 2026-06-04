<?php
$zip = new ZipArchive();
if ($zip->open("c:\\Users\\melan\\Documents\\MATTSO\\proyecto_matt\\plantillas\\C08 lista de asistencia (1).docx") === TRUE) {
    $content = $zip->getFromName('word/document.xml');
    file_put_contents('test_xml.txt', $content);
    $clean = strip_tags($content);
    file_put_contents('test_clean.txt', $clean);
}
echo "done";
