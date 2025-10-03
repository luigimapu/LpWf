<?php

require_once __DIR__ . '/CrudBaseAbstract.php';

class ArticoloVariante extends CrudBaseAbstract
{
    protected $table_name = 'articoli_varianti';

    protected $fillable_fields = [
        'articolo_id',
        'sku',
        'nome',
        'attributi_override',
        'stato',
    ];

    public $articolo_id;
    public $sku;
    public $nome;
    public $attributi_override;
    public $stato;
    public $deleted_il;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function create(): bool
    {
        if (empty($this->stato)) {
            $this->stato = 'ATTIVO';
        }

        return parent::create();
    }

    public function toSyncArray(): array
    {
        return [
            'id_centrale' => $this->id,
            'id_locale' => $this->id,
            'articolo_id' => $this->articolo_id,
            'sku' => $this->sku,
            'nome' => $this->nome,
            'stato' => $this->stato,
            'attributi_override' => $this->attributi_override ? json_decode($this->attributi_override, true) : null,
        ];
    }
}

