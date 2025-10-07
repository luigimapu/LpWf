<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogPricesController
{
    private HubDatabase $hub;
    public function __construct() { $this->hub = new HubDatabase(); }

    public function handle(string $method): void
    {
        $m = strtoupper($method);
        if ($m === 'PUT') { $this->setPrice(); return; }
        if ($m === 'GET') { $this->getPrice(); return; }
        $this->respond(405, ['message'=>'Usare GET o PUT']);
    }

    private function setPrice(): void
    {
        $d = $this->readJson();
        $varId = (int)($d['variante_id'] ?? 0);
        $prezzo = isset($d['prezzo']) ? (float)$d['prezzo'] : null;
        $prezzoConfronto = isset($d['prezzo_confronto']) ? (float)$d['prezzo_confronto'] : null;
        $qmin = isset($d['quantita_minima']) ? (float)$d['quantita_minima'] : null;
        $listinoCod = trim((string)($d['listino_codice'] ?? 'DEFAULT'));
        if ($varId<=0 || $prezzo===null) { $this->respond(422, ['message'=>'variante_id e prezzo obbligatori']); return; }
        $row = $this->hub->selectOne('SELECT v.id, a.tenant_id FROM articoli_varianti v JOIN articoli a ON a.id=v.articolo_id WHERE v.id=?', [$varId]);
        if (!$row) { $this->respond(404,['message'=>'Variante non trovata']); return; }
        $tenantId = (int)$row['tenant_id'];
        // Assicura listino
        $list = $this->hub->selectOne('SELECT id FROM listini WHERE tenant_id=? AND codice=?', [$tenantId,$listinoCod]);
        if (!$list) {
            $valuta = isset($d['valuta']) && $d['valuta'] ? substr(strtoupper(trim((string)$d['valuta'])),0,3) : 'EUR';
            $nomeListino = trim((string)($d['listino_nome'] ?? $listinoCod)) ?: $listinoCod;
            $this->hub->executeStatement('INSERT INTO listini (tenant_id, codice, nome, valuta, valido_dal, creato_il, aggiornato_il) VALUES (?, ?, ?, ?, CURDATE(), NOW(), NOW())', [$tenantId,$listinoCod,$nomeListino,$valuta]);
            $listId = (int)$this->hub->lastInsertId();
        } else { $listId = (int)$list['id']; }
        // Upsert prezzo
        $exists = $this->hub->selectOne('SELECT id FROM prezzi_articoli WHERE listino_id=? AND variante_id=?', [$listId,$varId]);
        if ($exists) {
            $this->hub->executeStatement('UPDATE prezzi_articoli SET prezzo=?, prezzo_confronto=?, quantita_minima=?, aggiornato_il=NOW() WHERE id=?', [$prezzo,$prezzoConfronto,$qmin,(int)$exists['id']]);
        } else {
            $this->hub->executeStatement('INSERT INTO prezzi_articoli (listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima, creato_il, aggiornato_il) VALUES (?,?,?,?,?,NOW(),NOW())', [$listId,$varId,$prezzo,$prezzoConfronto,$qmin]);
        }
        $this->respond(200, ['message'=>'Prezzo impostato']);
    }

    private function getPrice(): void
    {
        $varId = isset($_GET['variante_id']) ? (int)$_GET['variante_id'] : 0;
        $listinoCod = isset($_GET['listino_codice']) ? trim((string)$_GET['listino_codice']) : '';
        if ($varId<=0 || $listinoCod==='') { $this->respond(422, ['message'=>'variante_id e listino_codice obbligatori']); return; }
        $row = $this->hub->selectOne('SELECT v.id, a.tenant_id FROM articoli_varianti v JOIN articoli a ON a.id=v.articolo_id WHERE v.id=?', [$varId]);
        if (!$row) { $this->respond(404,['message'=>'Variante non trovata']); return; }
        $tenantId = (int)$row['tenant_id'];
        $list = $this->hub->selectOne('SELECT id, codice, valuta FROM listini WHERE tenant_id=? AND codice=?', [$tenantId,$listinoCod]);
        if (!$list) { $this->respond(200, ['prezzo'=>null,'valuta'=>null]); return; }
        $p = $this->hub->selectOne('SELECT prezzo, prezzo_confronto, quantita_minima FROM prezzi_articoli WHERE listino_id=? AND variante_id=?', [(int)$list['id'],$varId]);
        if (!$p) { $this->respond(200, ['prezzo'=>null,'valuta'=>$list['valuta']]); return; }
        $this->respond(200, ['prezzo'=>(float)$p['prezzo'],'prezzo_confronto'=>$p['prezzo_confronto']!==null?(float)$p['prezzo_confronto']:null,'quantita_minima'=>$p['quantita_minima']!==null?(float)$p['quantita_minima']:null,'valuta'=>$list['valuta']]);
    }

    private function readJson(): array { $raw=file_get_contents('php://input'); $d=json_decode($raw,true); if(!is_array($d)){$this->respond(400,['message'=>'JSON non valido']); exit;} return $d; }
    private function respond(int $s, array $p): void { http_response_code($s); header('Content-Type: application/json; charset=UTF-8'); echo json_encode($p, JSON_UNESCAPED_UNICODE); }
}
