<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogListsController
{
    private HubDatabase $hub;
    public function __construct() { $this->hub = new HubDatabase(); }

    public function handle(string $method, ?int $id = null): void
    {
        switch (strtoupper($method)) {
            case 'GET': $this->index($id); return;
            case 'POST': $this->create(); return;
            case 'PUT': if(!$id){$this->respond(400,['message'=>'ID mancante']); return;} $this->update($id); return;
            case 'DELETE': if(!$id){$this->respond(400,['message'=>'ID mancante']); return;} $this->delete($id); return;
            default: $this->respond(405, ['message'=>'Metodo non supportato']); return;
        }
    }

    private function index(?int $id): void
    {
        if ($id) {
            $row = $this->hub->selectOne('SELECT id, tenant_id, codice, nome, valuta, valido_dal, valido_al, priorita FROM listini WHERE id=?', [$id]);
            if (!$row) { $this->respond(404, ['message'=>'Listino non trovato']); return; }
            $this->respond(200, $row); return;
        }
        $tenantId = isset($_GET['tenant_id']) ? (int)$_GET['tenant_id'] : 0;
        if ($tenantId <= 0) { $this->respond(400, ['message'=>'tenant_id mancante']); return; }
        try {
            $rows = $this->hub->select('SELECT id, codice, nome, valuta, valido_dal, valido_al, priorita FROM listini WHERE tenant_id=? ORDER BY priorita DESC, id ASC', [$tenantId]);
            $this->respond(200, $rows ?: []);
        } catch (Throwable $e) { $this->respond(503, ['message'=>'Errore lettura listini: '.$e->getMessage()]); }
    }

    private function create(): void
    {
        $d = $this->readJson();
        $tenantId = (int)($d['tenant_id'] ?? 0);
        $codice = trim((string)($d['codice'] ?? ''));
        $nome = trim((string)($d['nome'] ?? $codice));
        $valuta = substr(strtoupper(trim((string)($d['valuta'] ?? 'EUR'))), 0, 3);
        $priorita = (int)($d['priorita'] ?? 0);
        $dal = !empty($d['valido_dal']) ? $d['valido_dal'] : null;
        $al = !empty($d['valido_al']) ? $d['valido_al'] : null;
        if ($tenantId<=0 || $codice==='') { $this->respond(422, ['message'=>'tenant_id e codice obbligatori']); return; }
        try {
            $this->hub->executeStatement('INSERT INTO listini (tenant_id, codice, nome, valuta, valido_dal, valido_al, priorita, creato_il, aggiornato_il) VALUES (?,?,?,?,?,?,?,NOW(),NOW())', [$tenantId,$codice,$nome,$valuta,$dal,$al,$priorita]);
            $id = (int)$this->hub->lastInsertId();
            $this->respond(201, ['message'=>'Listino creato','id'=>$id]);
        } catch (Throwable $e) { $this->respond(503, ['message'=>'Errore creazione listino: '.$e->getMessage()]); }
    }

    private function update(int $id): void
    {
        $d = $this->readJson();
        $fields = [];$params=[];
        foreach (['codice','nome','valuta','valido_dal','valido_al'] as $k) {
            if (array_key_exists($k,$d)) { $fields[] = "$k = ?"; $params[] = $d[$k]; }
        }
        if (isset($d['priorita'])) { $fields[]='priorita=?'; $params[]=(int)$d['priorita']; }
        if (empty($fields)) { $this->respond(400,['message'=>'Nessun campo da aggiornare']); return; }
        $fields[]='aggiornato_il=NOW()';
        $params[]=$id;
        try { $this->hub->executeStatement('UPDATE listini SET '.implode(', ',$fields).' WHERE id=?', $params); $this->respond(200,['message'=>'Listino aggiornato']); }
        catch (Throwable $e) { $this->respond(503,['message'=>'Errore aggiornamento listino: '.$e->getMessage()]); }
    }

    private function delete(int $id): void
    {
        try { $this->hub->executeStatement('DELETE FROM listini WHERE id=?', [$id]); $this->respond(200,['message'=>'Listino eliminato']); }
        catch (Throwable $e) { $this->respond(503,['message'=>'Errore eliminazione listino: '.$e->getMessage()]); }
    }

    private function readJson(): array { $raw=file_get_contents('php://input'); $d=json_decode($raw,true); if(!is_array($d)){$this->respond(400,['message'=>'JSON non valido']); exit;} return $d; }
    private function respond(int $s, $p): void { http_response_code($s); header('Content-Type: application/json; charset=UTF-8'); echo json_encode($p, JSON_UNESCAPED_UNICODE); }
}
