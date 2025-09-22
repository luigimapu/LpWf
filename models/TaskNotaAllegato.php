<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class TaskNotaAllegato extends CrudBaseAbstract
{
    protected $table_name = "task_note_allegati";
    protected $fillable_fields = ['id_nota', 'nome_file_originale', 'percorso_file', 'tipo_file'];

    public $id;
    public $id_nota;
    public $nome_file_originale;
    public $percorso_file;
    public $tipo_file;
    public $data_caricamento;
}