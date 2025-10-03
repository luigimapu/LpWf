<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

/**
 * Trova tutti i file con un nome specifico in una directory e nelle sue sottodirectory.
 *
 * @param string $directory La directory di partenza.
 * @param string $filename  Il nome del file da cercare (es. 'leggi.php').
 * @return array Un elenco di percorsi relativi dei file trovati.
 */
function trova_file_ricorsivamente(string $directory, string $filename): array
{
    $file_trovati = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getFilename() === $filename) {
            // Rimuoviamo la parte iniziale del percorso per renderlo un URL relativo
            $root_path = realpath($directory);
            $file_path = realpath($file->getPathname());
            $relative_path = str_replace($root_path, '', $file_path);
            
            // Normalizziamo i separatori di directory per gli URL
            $url_path = str_replace(DIRECTORY_SEPARATOR, '/', $relative_path);
            
            // Aggiungiamo il nome della cartella 'api' per creare l'URL corretto
            $file_trovati[] = 'api' . $url_path;
        }
    }
    return $file_trovati;
}

// Cerchiamo tutti gli endpoint di lettura partendo dalla directory corrente (la cartella 'api')
$endpoints = trova_file_ricorsivamente(__DIR__, 'leggi.php');

http_response_code(200);
echo json_encode($endpoints);