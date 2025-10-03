<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class SupervisorUtente extends CrudBaseAbstract
{
    protected $table_name = 'supervisori_utenti';
    protected $fillable_fields = ['supervisor_id', 'user_id'];

    public $supervisor_id;
    public $user_id;
}

