<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogRelationsController
{
    private HubDatabase $hub;
    public function __construct() { $this->hub = new HubDatabase(); }

    public function handle(string $method, ?int $id = null): void
    {
        switch (strtoupper($method)) {
            case 'POST': $this->create(); return;
            case 'PUT': if (!$id) { $this->respond(400,['message'=>'ID mancante']); return; } $this->update($id); return;
            case 'DELETE': if (!$id) { $this->respond(400,['message'=>'ID mancante']); return; } $this->delete($id); return;
            default: $this->respond(405,['message'=>'Metodo non supportato']); return;
        }
    }

    private function create(): void
    {
        $d = $this->readJson();
        $src = (int)($d['articolo_sorgente_id'] ?? 0);
        $dst = (int)($d['articolo_correlato_id'] ?? 0);
        $tipo = strtoupper(trim((string)($d['tipo_relazione'] ?? 'UPSELL')));
        $prio = (int)($d['priorita'] ?? 0);
        if ($src<=0 || $dst<=0) { $this->respond(422,['message'=>'articolo_sorgente_id e articolo_correlato_id obbligatori']); return; }
        try {
            $this->hub->executeStatement('INSERT INTO articoli_relazioni (articolo_sorgente_id, articolo_correlato_id, tipo_relazione, priorita, creato_il) VALUES (?,?,?,?, NOW())', [$src,$dst,$tipo,$prio]);
            $id = (int)$this->hub->lastInsertId();
            $this->respond(201, ['message'=>'Relazione creata','id'=>$id]);
        } catch (Throwable $e) { $this->respond(503,['message'=>'Errore creazione relazione: '.$e->getMessage()]); }
    }

    private function delete(int $id): void
    {
        try { $this->hub->executeStatement('DELETE FROM articoli_relazioni WHERE id=?', [$id]); $this->respond(200,['message'=>'Relazione eliminata']); }
        catch (Throwable $e) { $this->respond(503,['message'=>'Errore eliminazione relazione: '.$e->getMessage()]); }
    }

    private function update(int $id): void
    {
        $d = $this->readJson();
        $fields = [];
        $params = [];
        if (isset($d['tipo_relazione'])) { $fields[] = 'tipo_relazione = ?'; $params[] = strtoupper(trim((string)$d['tipo_relazione'])); }
        if (isset($d['priorita'])) { $fields[] = 'priorita = ?'; $params[] = (int)$d['priorita']; }
        if (!$fields) { $this->respond(400, ['message' => 'Nessun campo aggiornabile']); return; }
        $params[] = $id;
        try {
            $this->hub->executeStatement('UPDATE articoli_relazioni SET '.implode(', ', $fields).' WHERE id = ?', $params);
            $this->respond(200, ['message' => 'Relazione aggiornata']);
        } catch (Throwable $e) {
            $this->respond(503, ['message' => 'Errore aggiornamento relazione: '.$e->getMessage()]);
        }
    }

    private function readJson(): array { $raw=file_get_contents('php://input'); $d=json_decode($raw,true); if(!is_array($d)){$this->respond(400,['message'=>'JSON non valido']); exit;} return $d; }
    private function respond(int $s, array $p): void { http_response_code($s); header('Content-Type: application/json; charset=UTF-8'); echo json_encode($p, JSON_UNESCAPED_UNICODE); }
}
