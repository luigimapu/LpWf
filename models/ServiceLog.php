<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class ServiceLog extends CrudBaseAbstract
{
    protected $table_name = 'service_logs';
    protected $fillable_fields = [
        'service', 'action', 'provider', 'status', 'http_code',
        'request', 'response', 'user_id',
    ];

    public $id;
    public $service;
    public $action;
    public $provider;
    public $status;
    public $http_code;
    public $request;
    public $response;
    public $user_id;
    public $created_at;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }
}

