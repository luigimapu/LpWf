<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogCategoriesController
{
    private HubDatabase $hub;

    public function __construct()
    {
        $this->hub = new HubDatabase();
    }

    public function handle(string $method, ?int $id = null): void
    {
        switch ($method) {
            case 'GET':
                if ($id) { $this->getOne($id); } else { $this->list(); }
                return;
            case 'POST':
                $this->create();
                return;
            case 'PUT':
                if (!$id) { $this->respond(400, ['message' => 'ID mancante']); return; }
                $this->update($id);
                return;
            case 'DELETE':
                if (!$id) { $this->respond(400, ['message' => 'ID mancante']); return; }
                $this->delete($id);
                return;
            default:
                $this->respond(405, ['message' => 'Metodo non supportato']);
        }
    }

    private function list(): void
    {
        $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
        $sql = 'SELECT id, nome, slug, categoria_padre_id FROM categorie';
        $params = [];
        if ($q !== '') { $sql .= ' WHERE nome LIKE ? OR slug LIKE ?'; $like = '%' . $q . '%'; $params = [$like, $like]; }
        $sql .= ' ORDER BY nome ASC';
        $rows = $this->hub->select($sql, $params);
        $this->respond(200, $rows ?: []);
    }

    private function getOne(int $id): void
    {
        $row = $this->hub->selectOne('SELECT id, nome, slug, categoria_padre_id FROM categorie WHERE id = ?', [$id]);
        if (!$row) { $this->respond(404, ['message' => 'Categoria non trovata']); return; }
        $this->respond(200, $row);
    }

    private function create(): void
    {
        $data = $this->readJson();
        $nome = trim((string)($data['nome'] ?? ''));
        $slug = trim((string)($data['slug'] ?? ''));
        $parent = isset($data['categoria_padre_id']) ? (int)$data['categoria_padre_id'] : null;
        if ($nome === '') { $this->respond(422, ['message' => 'Nome obbligatorio']); return; }
        if ($slug === '') { $slug = $this->slugify($nome); }
        $slug = $this->ensureUniqueSlug($slug);
        $this->hub->executeStatement('INSERT INTO categorie (nome, slug, categoria_padre_id, creato_il, aggiornato_il) VALUES (?, ?, ?, NOW(), NOW())', [$nome, $slug, $parent ?: null]);
        $id = (int)$this->hub->lastInsertId();
        $this->respond(201, ['message' => 'Categoria creata', 'id' => $id, 'slug' => $slug]);
    }

    private function update(int $id): void
    {
        $row = $this->hub->selectOne('SELECT id, slug FROM categorie WHERE id = ?', [$id]);
        if (!$row) { $this->respond(404, ['message' => 'Categoria non trovata']); return; }
        $data = $this->readJson();
        $fields = [];
        $params = [];
        if (isset($data['nome'])) { $fields[] = 'nome = ?'; $params[] = trim((string)$data['nome']); }
        if (array_key_exists('categoria_padre_id', $data)) { $fields[] = 'categoria_padre_id = ?'; $params[] = ($data['categoria_padre_id'] !== null ? (int)$data['categoria_padre_id'] : null); }
        if (isset($data['slug'])) {
            $slug = trim((string)$data['slug']);
            if ($slug === '') { $slug = $this->slugify($data['nome'] ?? ('cat-' . $id)); }
            if ($slug !== $row['slug']) { $slug = $this->ensureUniqueSlug($slug, $id); }
            $fields[] = 'slug = ?'; $params[] = $slug;
        }
        if (empty($fields)) { $this->respond(400, ['message' => 'Nessun campo da aggiornare']); return; }
        $fields[] = 'aggiornato_il = NOW()';
        $params[] = $id;
        $sql = 'UPDATE categorie SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $this->hub->executeStatement($sql, $params);
        $this->respond(200, ['message' => 'Categoria aggiornata']);
    }

    private function delete(int $id): void
    {
        $this->hub->executeStatement('DELETE FROM categorie WHERE id = ?', [$id]);
        $this->respond(200, ['message' => 'Categoria eliminata']);
    }

    private function readJson(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data)) { $this->respond(400, ['message' => 'JSON non valido']); exit; }
        return $data;
    }

    private function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/i', '-', $text);
        $text = trim($text, '-');
        return $text ?: ('cat-' . date('YmdHis'));
    }

    private function ensureUniqueSlug(string $slug, ?int $excludeId = null): string
    {
        $base = $slug;
        $i = 1;
        while (true) {
            $params = [$slug];
            $sql = 'SELECT id FROM categorie WHERE slug = ?';
            if ($excludeId) { $sql .= ' AND id <> ?'; $params[] = $excludeId; }
            $r = $this->hub->selectOne($sql, $params);
            if (!$r) return $slug;
            $i++;
            $slug = $base . '-' . $i;
        }
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}

