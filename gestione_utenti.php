<?php
// Imposta l'header per visualizzare l'output come HTML ben formattato
header('Content-Type: text/html; charset=utf-8');


// Includi le classi necessarie usando i percorsi corretti
require_once 'config/Database.php';
require_once 'models/Utente.php';

// Inizializza il Database e il Modello Utente
$database = new Database();

echo "<h1>Test Gestione Utenti con CrudBase</h1>";
echo "<p>Questo script testa le operazioni CRUD generalizzate sulla tabella 'utenti'.</p>";
echo "<hr>";

// CREATE
echo "<h2>1. Creo un nuovo utente...</h2>";
$utente_nuovo = new Utente($database);
$utente_nuovo->nome = "Mario";
$utente_nuovo->cognome = "Rossi";
$utente_nuovo->email = "mario.rossi." . time() . "@example.com"; // Email unica

if ($utente_nuovo->create()) {
    echo "<p style='color:green;'>Utente '{$utente_nuovo->nome} {$utente_nuovo->cognome}' creato con successo. ID: <strong>{$utente_nuovo->id}</strong></p>";
    $id_appena_creato = $utente_nuovo->id;

    // READ (Find)
    echo "<h2>2. Leggo i dati dell'utente appena creato...</h2>";
    $utente_letto = new Utente($database);
    if ($utente_letto->find($id_appena_creato)) {
        echo "<p>Dati letti: <br>ID: {$utente_letto->id}<br>Nome: {$utente_letto->nome}<br>Cognome: {$utente_letto->cognome}<br>Email: {$utente_letto->email}</p>";

        // UPDATE
        echo "<h2>3. Aggiorno il nome dell'utente...</h2>";
        $utente_letto->nome = "Luigi";
        if ($utente_letto->update()) {
            echo "<p style='color:blue;'>Utente aggiornato con successo. Nuovo nome: <strong>{$utente_letto->nome}</strong></p>";
        } else {
            echo "<p style='color:red;'>Errore durante l'aggiornamento.</p>";
        }

        // DELETE
        echo "<h2>4. Cancello l'utente...</h2>";
        if ($utente_letto->delete()) {
            echo "<p style='color:orange;'>Utente con ID {$utente_letto->id} cancellato con successo.</p>";
        } else {
            echo "<p style='color:red;'>Errore durante la cancellazione.</p>";
        }
    } else {
        echo "<p style='color:red;'>Errore: non è stato possibile leggere l'utente con ID {$id_appena_creato}.</p>";
    }

} else {
    echo "<p style='color:red;'>Errore durante la creazione dell'utente.</p>";
}

echo "<hr>";

// READ ALL (FindAll)
echo "<h2>5. Lista finale degli utenti nel database</h2>";
$utente_lista = new Utente($database);
$lista_utenti = $utente_lista->findAll('cognome, nome'); // Ordina per cognome e nome
if ($lista_utenti && count($lista_utenti) > 0) {
    echo "<table border='1' cellpadding='5' cellspacing='0'><tr><th>ID</th><th>Nome</th><th>Cognome</th><th>Email</th><th>Data Creazione</th></tr>";
    foreach ($lista_utenti as $u) {
        echo "<tr><td>{$u['id']}</td><td>{$u['nome']}</td><td>{$u['cognome']}</td><td>{$u['email']}</td><td>{$u['data_creazione']}</td></tr>";
    }
    echo "</table>";
} else {
    echo "<p>Nessun utente trovato nel database.</p>";
}

?>