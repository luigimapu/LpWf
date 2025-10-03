<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class UserRoleAudit extends CrudBaseAbstract
{
    protected $table_name = 'user_role_audit';
    protected $fillable_fields = ['target_user_id', 'old_role', 'new_role', 'changed_by_user_id', 'changed_at'];

    public $id;
    public $target_user_id;
    public $old_role;
    public $new_role;
    public $changed_by_user_id;
    public $changed_at;
}

