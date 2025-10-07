<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogVariantsController
{
    private HubDatabase $hub;
    public function __construct() { $this->hub = new HubDatabase(); }

    public function handle(string $method, ?int $id = null): void
    {
        switch ($method) {
            case 'POST': $this->create(); return;
            case 'PUT': if (!$id) { $this->respond(400,['message'=>'ID mancante']); return; } $this->update($id); return;
            case 'DELETE': if (!$id) { $this->respond(400,['message'=>'ID mancante']); return; } $this->delete($id); return;
            default: $this->respond(405, ['message'=>'Metodo non supportato']); return;
        }
    }

    private function create(): void
    {
        $data = $this->readJson();
        $articoloId = (int)($data['articolo_id'] ?? 0);
        $sku = trim((string)($data['sku'] ?? ''));
        $nome = trim((string)($data['nome'] ?? ''));
        $stato = strtoupper(trim((string)($data['stato'] ?? 'ATTIVO')));
        if ($articoloId <= 0 || $sku === '' || $nome === '') { $this->respond(422, ['message'=>'articolo_id, sku, nome obbligatori']); return; }
        try {
            $sql = 'INSERT INTO articoli_varianti (articolo_id, sku, nome, stato, creato_il, aggiornato_il) VALUES (?, ?, ?, ?, NOW(), NOW())';
            $this->hub->executeStatement($sql, [$articoloId, $sku, $nome, $stato]);
            $id = (int)$this->hub->lastInsertId();
            $this->respond(201, ['message'=>'Variante creata', 'id'=>$id]);
        } catch (Throwable $e) { $this->respond(503, ['message'=>'Errore creazione variante: '.$e->getMessage()]); }
    }

    private function update(int $id): void
    {
        $data = $this->readJson();
        $fields = [];$params=[];
        if (isset($data['sku'])) { $fields[]='sku=?'; $params[]=trim((string)$data['sku']); }
        if (isset($data['nome'])) { $fields[]='nome=?'; $params[]=trim((string)$data['nome']); }
        if (isset($data['stato'])) { $fields[]='stato=?'; $params[]=strtoupper(trim((string)$data['stato'])); }
        if (empty($fields)) { $this->respond(400,['message'=>'Nessun campo da aggiornare']); return; }
        $fields[]='aggiornato_il=NOW()'; $params[]=$id;
        try { $this->hub->executeStatement('UPDATE articoli_varianti SET '.implode(', ',$fields).' WHERE id=?', $params); $this->respond(200,['message'=>'Variante aggiornata']); }
        catch (Throwable $e) { $this->respond(503,['message'=>'Errore aggiornamento: '.$e->getMessage()]); }
    }

    private function delete(int $id): void
    {
        try { $this->hub->executeStatement('DELETE FROM articoli_varianti WHERE id=?', [$id]); $this->respond(200,['message'=>'Variante eliminata']); }
        catch (Throwable $e) { $this->respond(503,['message'=>'Errore eliminazione: '.$e->getMessage()]); }
    }

    private function readJson(): array { $raw=file_get_contents('php://input'); $d=json_decode($raw,true); if(!is_array($d)){$this->respond(400,['message'=>'JSON non valido']); exit;} return $d; }
    private function respond(int $s, array $p): void { http_response_code($s); header('Content-Type: application/json; charset=UTF-8'); echo json_encode($p, JSON_UNESCAPED_UNICODE); }
}

