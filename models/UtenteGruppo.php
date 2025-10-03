<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class UtenteGruppo extends CrudBaseAbstract
{
    protected $table_name = "utenti_gruppi";
    protected $fillable_fields = ['utente_id', 'gruppo_id'];
    // Nota: questa tabella non ha un campo 'id' auto-incrementante

    // Dichiariamo esplicitamente le proprietà pubbliche per essere
    // compatibili con le versioni recenti di PHP.
    public $utente_id;
    public $gruppo_id;

}