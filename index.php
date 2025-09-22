<?php
// Definiamo i percorsi dei file da includere.
// NOTA: Sto usando 'dashboard.html' che abbiamo creato in precedenza.
// Se hai un 'dashboard.php' che genera HTML, il principio è lo stesso.
$dashboard_file = 'mia_dashboard.html';
$http_client_file = 'http_client.html'; // Assumo che questo file esista.
require_once __DIR__ . '/config/env_loader.php';
loadEnv(__DIR__ . '/.env');

// Leggiamo il contenuto dei file come stringhe.
// Aggiungiamo un controllo per mostrare un errore se un file non viene trovato.
$dashboard_content = file_exists($dashboard_file) 
    ? file_get_contents($dashboard_file) 
    : "<h2>Errore</h2><p>File non trovato: <strong>{$dashboard_file}</strong></p>";

$http_client_content = file_exists($http_client_file) 
    ? file_get_contents($http_client_file) 
    : "<h2>Errore</h2><p>File non trovato: <strong>{$http_client_file}</strong></p>";
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale: 1.0">
    <title>Interfaccia Principale</title>
    <style>
        /* Stili per creare il layout a due colonne */
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: sans-serif;
            overflow: hidden; /* Impedisce lo scroll del corpo principale */
        }
        .main-container {
            display: flex;
            height: 100vh; /* Altezza piena della finestra */
        }
        .panel {
            flex: 1; /* Ogni pannello occupa metà dello spazio */
            overflow-y: auto; /* Abilita lo scroll verticale solo se necessario */
            height: 100vh;
            box-sizing: border-box; /* Include padding e bordi nel calcolo della larghezza/altezza */
        }
        .left-panel {
            /* Il contenuto del dashboard verrà inserito qui */
            border-right: 2px solid #ccc;
        }
        .right-panel {
            /* Il contenuto del client HTTP verrà inserito qui */
        }
        /*
         I file sorgente (dashboard.html, http_client.html) hanno i loro stili.
         Potremmo dover aggiungere qui degli override se ci sono conflitti,
         ma per ora questo è il layout di base.
        */
    </style>
</head>
<body>

    <div class="main-container">
        
        <div class="panel left-panel">
            <?php
                // Inseriamo il contenuto del file del dashboard direttamente qui.
                echo $dashboard_content;
            ?>
        </div>
        
        <div class="panel right-panel">
            <?php
                // E qui inseriamo il contenuto del client HTTP.
                echo $http_client_content;
            ?>
        </div>

    </div>

</body>
</html>