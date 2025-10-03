<?php

require_once __DIR__ . '/CrudBaseAbstract.php';

class Articolo extends CrudBaseAbstract
{
    protected $table_name = 'articoli';

    protected $fillable_fields = [
        'tenant_id',
        'sku_globale',
        'tipologia',
        'titolo',
        'sottotitolo',
        'descrizione',
        'stato_pubblicazione',
        'visibilita',
        'set_attributi_id',
        'metadati',
    ];

    public $tenant_id;
    public $sku_globale;
    public $tipologia;
    public $titolo;
    public $sottotitolo;
    public $descrizione;
    public $stato_pubblicazione;
    public $visibilita;
    public $set_attributi_id;
    public $metadati;
    public $pubblica_il;
    public $ritira_il;
    public $deleted_il;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function create(): bool
    {
        if (empty($this->tenant_id)) {
            $this->tenant_id = getenv('TENANT_ID') ?: null;
        }

        if ($this->tenant_id === null) {
            throw new RuntimeException('Impossibile creare articolo: tenant_id mancante.');
        }

        if (empty($this->tipologia)) {
            $this->tipologia = 'SERVIZIO';
        }
        if (empty($this->stato_pubblicazione)) {
            $this->stato_pubblicazione = 'BOZZA';
        }
        if (empty($this->visibilita)) {
            $this->visibilita = 'PRIVATO';
        }

        return parent::create();
    }

    public function toSyncArray(): array
    {
        return [
            'id_centrale' => $this->id,
            'id_locale' => $this->id,
            'tenant_id' => $this->tenant_id,
            'sku_globale' => $this->sku_globale,
            'tipologia' => $this->tipologia,
            'titolo' => $this->titolo,
            'sottotitolo' => $this->sottotitolo,
            'descrizione' => $this->descrizione,
            'stato_pubblicazione' => $this->stato_pubblicazione,
            'visibilita' => $this->visibilita,
            'set_attributi_id' => $this->set_attributi_id,
            'metadati' => $this->metadati ? json_decode($this->metadati, true) : null,
        ];
    }
}

