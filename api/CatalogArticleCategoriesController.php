<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogArticleCategoriesController
{
    private HubDatabase $hub;
    public function __construct() { $this->hub = new HubDatabase(); }

    public function handle(string $method, int $articoloId): void
    {
        if (strtoupper($method) !== 'PUT') { $this->respond(405, ['message'=>'Usare PUT']); return; }
        $data = $this->readJson();
        $slugs = isset($data['categorie_slugs']) && is_array($data['categorie_slugs']) ? $data['categorie_slugs'] : [];
        // Trova ids
        $ids = [];
        if (!empty($slugs)) {
            $in = implode(',', array_fill(0, count($slugs), '?'));
            $rows = $this->hub->select('SELECT id, slug FROM categorie WHERE slug IN ('.$in.')', array_map('strval',$slugs));
            foreach ($rows as $r) { $ids[] = (int)$r['id']; }
        }
        try {
            $this->hub->executeStatement('DELETE FROM articoli_categorie WHERE articolo_id=?', [$articoloId]);
            if (!empty($ids)) {
                $values = [];$params=[];
                foreach ($ids as $cid) { $values[]='(?,?)'; $params[]=$articoloId; $params[]=$cid; }
                $this->hub->executeStatement('INSERT INTO articoli_categorie (articolo_id, categoria_id) VALUES '.implode(',', $values), $params);
            }
            $this->respond(200, ['message'=>'Categorie aggiornate']);
        } catch (Throwable $e) { $this->respond(503,['message'=>'Errore aggiornamento categorie: '.$e->getMessage()]); }
    }

    private function readJson(): array { $raw=file_get_contents('php://input'); $d=json_decode($raw,true); if(!is_array($d)){$this->respond(400,['message'=>'JSON non valido']); exit;} return $d; }
    private function respond(int $s, array $p): void { http_response_code($s); header('Content-Type: application/json; charset=UTF-8'); echo json_encode($p, JSON_UNESCAPED_UNICODE); }
}

