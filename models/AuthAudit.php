<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class AuthAudit extends CrudBaseAbstract
{
    protected $table_name = 'auth_audit';
    protected $fillable_fields = ['user_id', 'action', 'ip', 'user_agent', 'created_at'];

    public $id;
    public $user_id;
    public $action;
    public $ip;
    public $user_agent;
    public $created_at;
}

