<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogMediaController
{
    private HubDatabase $hubDb;

    public function __construct()
    {
        $this->hubDb = new HubDatabase();
    }

    public function handle(string $method, ?int $id = null, ?string $action = null): void
    {
        if ($method === 'POST') {
            if ($action === 'attach' || $action === null) { $this->handleAttach(); return; }
            if ($action === 'upload') { $this->handleUpload(); return; }
            if ($action === 'reorder') { $this->handleReorder(); return; }
            if ($id && $action === 'move') { $this->handleMove($id); return; }
            if ($id && $action === 'cover') { $this->handleCover($id); return; }
        }
        if ($method === 'PUT' && $id) { $this->handleUpdate($id); return; }
        if ($id && $method === 'DELETE') {
            $this->handleDelete($id);
            return;
        }
        $this->respond(404, ['message' => 'Azione non supportata']);
    }

    private function handleAttach(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) { $this->respond(400, ['message' => 'JSON non valido']); return; }

        $articoloId = isset($data['articolo_id']) ? (int)$data['articolo_id'] : 0;
        $url = trim((string)($data['url'] ?? ''));
        $tipologia = strtoupper(trim((string)($data['tipologia'] ?? 'IMMAGINE')));
        $alt = trim((string)($data['testo_alternativo'] ?? ''));

        if ($articoloId <= 0 || $url === '') {
            $this->respond(400, ['message' => 'Parametri mancanti: articolo_id, url']);
            return;
        }

        $articolo = $this->hubDb->selectOne('SELECT id, tenant_id FROM articoli WHERE id = ?', [$articoloId]);
        if (!$articolo) { $this->respond(404, ['message' => 'Articolo non trovato']); return; }

        $posRow = $this->hubDb->selectOne('SELECT COALESCE(MAX(posizione),0) AS maxpos FROM risorse_multimediali WHERE articolo_id = ?', [$articoloId]);
        $pos = (int)($posRow['maxpos'] ?? 0) + 1;

        $sql = 'INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione) VALUES (?, ?, ?, ?, ?, ?)';
        $this->hubDb->executeStatement($sql, [ (int)$articolo['tenant_id'], $articoloId, $tipologia ?: 'IMMAGINE', $url, $alt, $pos ]);
        $id = (int)$this->hubDb->lastInsertId();
        $this->respond(201, ['message' => 'Media associato', 'id' => $id]);
    }

    private function handleUpload(): void
    {
        // multipart/form-data expected: fields articolo_id, file, testo_alternativo?, tipologia?
        $articoloId = isset($_POST['articolo_id']) ? (int)$_POST['articolo_id'] : 0;
        if ($articoloId <= 0) { $this->respond(400, ['message' => 'articolo_id mancante']); return; }

        if (!isset($_FILES['file']) || !is_array($_FILES['file']) || ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $this->respond(400, ['message' => 'File mancante o upload non valido']);
            return;
        }
        $file = $_FILES['file'];
        $origName = (string)($file['name'] ?? '');
        $tmpPath = (string)($file['tmp_name'] ?? '');
        if (!is_uploaded_file($tmpPath)) { $this->respond(400, ['message' => 'Upload non valido']); return; }

        // Limite dimensione: 10 MB
        $size = (int)($file['size'] ?? 0);
        $maxBytes = 10 * 1024 * 1024; // 10 MB
        if ($size <= 0) { $this->respond(400, ['message' => 'Dimensione file non valida']); return; }
        if ($size > $maxBytes) { $this->respond(413, ['message' => 'File troppo grande (max 10 MB)']); return; }

        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowedExt = ['jpg','jpeg','png','gif','webp','svg'];
        if (!in_array($ext, $allowedExt, true)) {
            $this->respond(400, ['message' => 'Formato non supportato. Consenti: jpg, jpeg, png, gif, webp, svg']);
            return;
        }

        // Assicurati che la cartella esista
        $destDir = __DIR__ . '/../uploads/catalog_media';
        if (!is_dir($destDir)) {
            if (!mkdir($destDir, 0775, true) && !is_dir($destDir)) {
                $this->respond(500, ['message' => 'Impossibile creare la cartella upload']);
                return;
            }
        }

        // Genera nome file unico
        $safeBase = preg_replace('/[^a-z0-9-_]+/i', '-', pathinfo($origName, PATHINFO_FILENAME));
        $safeBase = trim($safeBase, '-');
        if ($safeBase === '') { $safeBase = 'media'; }
        $unique = $safeBase . '-' . date('YmdHis') . '-' . bin2hex(random_bytes(3)) . '.' . $ext;
        $destPath = $destDir . '/' . $unique;

        if (!move_uploaded_file($tmpPath, $destPath)) {
            $this->respond(500, ['message' => 'Salvataggio file fallito']);
            return;
        }

        // Calcola URL pubblico relativo
        $publicUrl = 'uploads/catalog_media/' . $unique;

        // Recupera tenant e posizione
        $articolo = $this->hubDb->selectOne('SELECT id, tenant_id FROM articoli WHERE id = ?', [$articoloId]);
        if (!$articolo) { $this->respond(404, ['message' => 'Articolo non trovato']); return; }
        $posRow = $this->hubDb->selectOne('SELECT COALESCE(MAX(posizione),0) AS maxpos FROM risorse_multimediali WHERE articolo_id = ?', [$articoloId]);
        $pos = (int)($posRow['maxpos'] ?? 0) + 1;

        $tipologia = strtoupper(trim((string)($_POST['tipologia'] ?? 'IMMAGINE')));
        $alt = trim((string)($_POST['testo_alternativo'] ?? ''));
        $sql = 'INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione) VALUES (?, ?, ?, ?, ?, ?)';
        $this->hubDb->executeStatement($sql, [ (int)$articolo['tenant_id'], $articoloId, $tipologia ?: 'IMMAGINE', $publicUrl, $alt, $pos ]);
        $newId = (int)$this->hubDb->lastInsertId();
        $this->respond(201, ['message' => 'Media caricato', 'id' => $newId, 'url' => $publicUrl]);
    }

    private function handleMove(int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $direction = strtolower((string)($data['direction'] ?? ''));
        if (!in_array($direction, ['up','down'], true)) { $this->respond(400, ['message' => 'direction deve essere up o down']); return; }

        $row = $this->hubDb->selectOne('SELECT id, articolo_id, posizione FROM risorse_multimediali WHERE id = ?', [$id]);
        if (!$row) { $this->respond(404, ['message' => 'Media non trovato']); return; }
        $articoloId = (int)$row['articolo_id'];
        $pos = (int)$row['posizione'];

        if ($direction === 'up') {
            $neighbor = $this->hubDb->selectOne('SELECT id, posizione FROM risorse_multimediali WHERE articolo_id = ? AND posizione < ? ORDER BY posizione DESC LIMIT 1', [$articoloId, $pos]);
        } else {
            $neighbor = $this->hubDb->selectOne('SELECT id, posizione FROM risorse_multimediali WHERE articolo_id = ? AND posizione > ? ORDER BY posizione ASC LIMIT 1', [$articoloId, $pos]);
        }
        if (!$neighbor) { $this->respond(200, ['message' => 'Nessun elemento da scambiare', 'id' => $id]); return; }

        // Scambia le posizioni
        $this->hubDb->executeStatement('UPDATE risorse_multimediali SET posizione = ? WHERE id = ?', [$neighbor['posizione'], $id]);
        $this->hubDb->executeStatement('UPDATE risorse_multimediali SET posizione = ? WHERE id = ?', [$pos, (int)$neighbor['id']]);
        $this->respond(200, ['message' => 'Posizione aggiornata']);
    }

    private function handleCover(int $id): void
    {
        $row = $this->hubDb->selectOne('SELECT id, articolo_id, posizione FROM risorse_multimediali WHERE id = ?', [$id]);
        if (!$row) { $this->respond(404, ['message' => 'Media non trovato']); return; }
        $articoloId = (int)$row['articolo_id'];
        try {
            $this->hubDb->conn->beginTransaction();
            // Porta l'elemento in testa (posizione 1)
            $this->hubDb->executeStatement('UPDATE risorse_multimediali SET posizione = posizione + 1 WHERE articolo_id = ? AND id <> ?', [$articoloId, $id]);
            $this->hubDb->executeStatement('UPDATE risorse_multimediali SET posizione = 1 WHERE id = ?', [$id]);
            $this->hubDb->conn->commit();
        } catch (Throwable $e) {
            try { $this->hubDb->conn->rollBack(); } catch (Throwable $e2) {}
            $this->respond(500, ['message' => 'Errore impostazione copertina']);
            return;
        }
        $this->respond(200, ['message' => 'Impostato come copertina']);
    }

    private function handleUpdate(int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) { $this->respond(400, ['message' => 'JSON non valido']); return; }
        $row = $this->hubDb->selectOne('SELECT id FROM risorse_multimediali WHERE id = ?', [$id]);
        if (!$row) { $this->respond(404, ['message' => 'Media non trovato']); return; }

        $fields = [];
        $params = [];
        if (array_key_exists('testo_alternativo', $data)) { $fields[] = 'testo_alternativo = ?'; $params[] = trim((string)$data['testo_alternativo']); }
        if (array_key_exists('tipologia', $data)) { $fields[] = 'tipologia = ?'; $params[] = strtoupper(trim((string)$data['tipologia'])); }
        if (array_key_exists('url', $data)) { $fields[] = 'url = ?'; $params[] = trim((string)$data['url']); }
        if (!$fields) { $this->respond(400, ['message' => 'Nessun campo aggiornabile fornito']); return; }
        $params[] = $id;
        $sql = 'UPDATE risorse_multimediali SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $this->hubDb->executeStatement($sql, $params);
        $this->respond(200, ['message' => 'Media aggiornato']);
    }

    private function handleReorder(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) { $this->respond(400, ['message' => 'JSON non valido']); return; }
        $articoloId = (int)($data['articolo_id'] ?? 0);
        $ordered = $data['ordered_ids'] ?? null;
        if ($articoloId <= 0 || !is_array($ordered) || !count($ordered)) { $this->respond(400, ['message' => 'Parametri mancanti: articolo_id, ordered_ids']); return; }
        // Verifica che tutti gli id appartengano all'articolo
        $rows = $this->hubDb->select('SELECT id FROM risorse_multimediali WHERE articolo_id = ? ORDER BY posizione ASC, id ASC', [$articoloId]);
        $existingIds = array_map(fn($r) => (int)$r['id'], $rows ?: []);
        $orderedIds = array_values(array_unique(array_map('intval', $ordered)));
        // Se mancano elementi o ci sono estranei, fallback a 400
        sort($existingIds);
        $tmp = $orderedIds; sort($tmp);
        if ($tmp !== $existingIds) { $this->respond(400, ['message' => 'Lista id non coerente con i media esistenti']); return; }
        try {
            $this->hubDb->conn->beginTransaction();
            $pos = 1;
            foreach ($orderedIds as $mid) {
                $this->hubDb->executeStatement('UPDATE risorse_multimediali SET posizione = ? WHERE id = ?', [$pos++, $mid]);
            }
            $this->hubDb->conn->commit();
        } catch (Throwable $e) {
            try { $this->hubDb->conn->rollBack(); } catch (Throwable $e2) {}
            $this->respond(500, ['message' => 'Errore riordino media']);
            return;
        }
        $this->respond(200, ['message' => 'Ordine aggiornato']);
    }

    private function handleDelete(int $id): void
    {
        $row = $this->hubDb->selectOne('SELECT id FROM risorse_multimediali WHERE id = ?', [$id]);
        if (!$row) { $this->respond(404, ['message' => 'Media non trovato']); return; }
        $this->hubDb->executeStatement('DELETE FROM risorse_multimediali WHERE id = ?', [$id]);
        $this->respond(200, ['message' => 'Media rimosso']);
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}
