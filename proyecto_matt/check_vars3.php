<?php
$dir = "c:\\Users\\melan\\Documents\\MATTSO\\proyecto_matt\\plantillas";
$files = glob("$dir\\*.*");

$vars = [];

foreach($files as $file) {
    if (strpos($file, '.docx') !== false || strpos($file, '.xlsx') !== false) {
        $zip = new ZipArchive();
        if ($zip->open($file) === TRUE) {
            for($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);
                if (strpos($filename, 'word/document.xml') !== false || strpos($filename, 'xl/sharedStrings.xml') !== false || strpos($filename, 'xl/worksheets/sheet1.xml') !== false) {
                    $content = $zip->getFromIndex($i);
                    $clean = strip_tags($content);
                    if (preg_match_all('/SMD_([a-zA-Z0-9_]+)/', $clean, $matches)) {
                        foreach($matches[0] as $m) {
                            $vars[] = $m;
                        }
                    }
                }
            }
            $zip->close();
        }
    }
}
$vars = array_unique($vars);
sort($vars);
echo "Variables SMD encontradas: \n";
print_r($vars);
