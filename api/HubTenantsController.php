<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class HubTenantsController
{
    private HubDatabase $hub;

    public function __construct()
    {
        $this->hub = new HubDatabase();
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function requireAdmin(): void
    {
        $u = $_SERVER['AUTH_USER'] ?? null;
        $role = strtoupper($u['ruolo'] ?? '');
        if ($role !== 'ADMIN') {
            $this->respond(403, ['message' => 'Solo ADMIN può eseguire questa operazione.']);
        }
    }

    public function handle(string $method, ?int $id = null): void
    {
        switch ($method) {
            case 'GET':
                $this->handleGet($id); return;
            case 'POST':
                $this->requireAdmin();
                $this->handleCreate(); return;
            case 'PUT':
                $this->requireAdmin();
                if (!$id) { $this->respond(400, ['message' => 'ID mancante']); }
                $this->handleUpdate($id); return;
            default:
                $this->respond(405, ['message' => 'Metodo non supportato']);
        }
    }

    private function handleGet(?int $id): void
    {
        if ($id) {
            $row = $this->hub->selectOne('SELECT id, ragione_sociale, slug, stato, creato_il, aggiornato_il FROM tenants WHERE id = ?', [$id]);
            if (!$row) { $this->respond(404, ['message' => 'Tenant non trovato']); }
            $this->respond(200, $row);
        } else {
            $rows = $this->hub->select('SELECT id, ragione_sociale, slug, stato FROM tenants ORDER BY ragione_sociale');
            $this->respond(200, $rows ?: []);
        }
    }

    private function handleCreate(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) { $this->respond(400, ['message' => 'JSON non valido']); }
        $name = trim((string)($data['ragione_sociale'] ?? ''));
        $slug = trim((string)($data['slug'] ?? ''));
        $stato = strtoupper(trim((string)($data['stato'] ?? 'IN_ONBOARDING')));
        if ($name === '' || $slug === '') { $this->respond(422, ['message' => 'ragione_sociale e slug sono obbligatori']); }
        if (!preg_match('/^[a-z0-9][a-z0-9_\.-]{1,118}[a-z0-9]$/', $slug)) {
            $this->respond(422, ['message' => 'Slug non valido (caratteri ammessi: a-z0-9._- e lunghezza 3..120)']);
        }
        if (!in_array($stato, ['ATTIVO','SOSPESO','IN_ONBOARDING'], true)) { $stato = 'IN_ONBOARDING'; }
        $exists = $this->hub->selectOne('SELECT id FROM tenants WHERE slug = ? LIMIT 1', [$slug]);
        if ($exists) { $this->respond(409, ['message' => 'Slug già esistente']); }
        try {
            $this->hub->executeStatement('INSERT INTO tenants (ragione_sociale, slug, stato, creato_il, aggiornato_il) VALUES (?, ?, ?, NOW(), NOW())', [$name, $slug, $stato]);
            $id = (int)$this->hub->lastInsertId();
            $this->respond(201, ['message' => 'Tenant creato', 'id' => $id]);
        } catch (Throwable $e) {
            $this->respond(503, ['message' => 'Errore creazione tenant']);
        }
    }

    private function handleUpdate(int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) { $this->respond(400, ['message' => 'JSON non valido']); }
        $fields = [];$params=[];
        if (isset($data['ragione_sociale'])) { $name = trim((string)$data['ragione_sociale']); if ($name === '') { $this->respond(422, ['message'=>'ragione_sociale non può essere vuoto']); } $fields[]='ragione_sociale=?'; $params[]=$name; }
        if (isset($data['slug'])) {
            $slug = trim((string)$data['slug']);
            if (!preg_match('/^[a-z0-9][a-z0-9_\.-]{1,118}[a-z0-9]$/', $slug)) {
                $this->respond(422, ['message' => 'Slug non valido']);
            }
            $dup = $this->hub->selectOne('SELECT id FROM tenants WHERE slug = ? AND id <> ? LIMIT 1', [$slug, $id]);
            if ($dup) { $this->respond(409, ['message' => 'Slug già in uso']); }
            $fields[]='slug=?'; $params[]=$slug;
        }
        if (isset($data['stato'])) {
            $st = strtoupper(trim((string)$data['stato']));
            if (!in_array($st, ['ATTIVO','SOSPESO','IN_ONBOARDING'], true)) {
                $this->respond(422, ['message' => 'Stato non valido']);
            }
            $fields[]='stato=?'; $params[]=$st;
        }
        if (!$fields) { $this->respond(400, ['message' => 'Nessun campo da aggiornare']); }
        $fields[] = 'aggiornato_il = NOW()';
        $params[] = $id;
        try {
            $this->hub->executeStatement('UPDATE tenants SET '.implode(', ',$fields).' WHERE id = ?', $params);
            $this->respond(200, ['message' => 'Tenant aggiornato']);
        } catch (Throwable $e) {
            $this->respond(503, ['message' => 'Errore aggiornamento tenant']);
        }
    }
}

