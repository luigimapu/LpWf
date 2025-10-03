<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class TaskNotaAllegato extends CrudBaseAbstract
{
    protected $table_name = "task_note_allegati";
    // Allinea ai campi realmente presenti nello schema (nessun tipo_file)
    protected $fillable_fields = ['id_nota', 'nome_file_originale', 'percorso_file'];

    public $id;
    public $id_nota;
    public $nome_file_originale;
    public $percorso_file;
    public $data_caricamento;
}
