<?php
require_once __DIR__ . '/../config/HubDatabase.php';

class CatalogController
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
                $this->respond(405, ['message' => 'Solo scrittura consentita qui.']);
                return;
            case 'POST':
                $this->createArticolo();
                return;
            case 'PUT':
                if (!$id) { $this->respond(400, ['message' => 'ID mancante']); return; }
                $this->updateArticolo($id);
                return;
            default:
                $this->respond(405, ['message' => 'Metodo non supportato']);
                return;
        }
    }

    private function createArticolo(): void
    {
        $data = $this->readJson();
        $titolo = trim((string)($data['titolo'] ?? ''));
        if ($titolo === '') {
            $this->respond(422, ['message' => 'Campo obbligatorio: titolo']);
            return;
        }
        $tip = strtoupper(trim((string)($data['tipologia'] ?? 'FISICO')));
        if ($tip === 'PRODOTTO') { $tip = 'FISICO'; }
        $vis = strtoupper(trim((string)($data['visibilita'] ?? 'PRIVATO')));
        $stato = strtoupper(trim((string)($data['stato_pubblicazione'] ?? 'BOZZA')));
        $sottotitolo = trim((string)($data['sottotitolo'] ?? '')) ?: null;
        $descrizione = trim((string)($data['descrizione'] ?? '')) ?: null;
        $marca = trim((string)($data['marca'] ?? '')) ?: null;
        $modello = trim((string)($data['modello'] ?? '')) ?: null;
        $versione = trim((string)($data['versione'] ?? '')) ?: null;
        $codiceTenant = trim((string)($data['codice_tenant'] ?? '')) ?: null;
        $tenantId = isset($data['tenant_id']) ? (int)$data['tenant_id'] : 0;
        if ($tenantId <= 0) {
            $row = $this->hub->selectOne('SELECT id FROM tenants ORDER BY id ASC LIMIT 1');
            if (!$row) { $this->respond(500, ['message' => 'Nessun tenant disponibile nel catalogo']); return; }
            $tenantId = (int)$row['id'];
        }

        try {
            // Genera SKU globale sequenziale e protocolla
            [$skuGlobale, $protocolId] = $this->generateGlobalSku($tenantId);

            $sql = 'INSERT INTO articoli (tenant_id, sku_globale, codice_tenant, marca, modello, versione, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita, creato_il, aggiornato_il)'
                 . ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
            $this->hub->executeStatement($sql, [$tenantId, $skuGlobale, $codiceTenant, $marca, $modello, $versione, $tip, $titolo, $sottotitolo, $descrizione, $stato, $vis]);
            $id = (int)$this->hub->lastInsertId();
            // Collega il protocollo all'articolo
            $this->hub->executeStatement('UPDATE sku_protocolli SET articolo_id = ? WHERE id = ?', [$id, $protocolId]);
            $this->respond(201, ['message' => 'Creato', 'id' => $id, 'sku' => $skuGlobale]);
        } catch (Throwable $e) {
            $this->respond(503, ['message' => 'Errore creazione articolo: ' . $e->getMessage()]);
        }
    }

    private function updateArticolo(int $id): void
    {
        $data = $this->readJson();
        $fields = [];
        $params = [];
        if (isset($data['titolo'])) { $fields[] = 'titolo = ?'; $params[] = trim((string)$data['titolo']); }
        if (array_key_exists('sottotitolo', $data)) { $fields[] = 'sottotitolo = ?'; $params[] = $this->nullIfEmpty($data['sottotitolo']); }
        if (array_key_exists('descrizione', $data)) { $fields[] = 'descrizione = ?'; $params[] = $this->nullIfEmpty($data['descrizione']); }
        if (isset($data['stato_pubblicazione'])) { $fields[] = 'stato_pubblicazione = ?'; $params[] = strtoupper(trim((string)$data['stato_pubblicazione'])); }
        if (isset($data['visibilita'])) { $fields[] = 'visibilita = ?'; $params[] = strtoupper(trim((string)$data['visibilita'])); }
        if (array_key_exists('marca', $data)) { $fields[] = 'marca = ?'; $params[] = $this->nullIfEmpty($data['marca']); }
        if (array_key_exists('modello', $data)) { $fields[] = 'modello = ?'; $params[] = $this->nullIfEmpty($data['modello']); }
        if (array_key_exists('versione', $data)) { $fields[] = 'versione = ?'; $params[] = $this->nullIfEmpty($data['versione']); }
        if (array_key_exists('codice_tenant', $data)) { $fields[] = 'codice_tenant = ?'; $params[] = $this->nullIfEmpty($data['codice_tenant']); }
        if (isset($data['tipologia'])) { $t = strtoupper(trim((string)$data['tipologia'])); if ($t === 'PRODOTTO') $t='FISICO'; $fields[] = 'tipologia = ?'; $params[] = $t; }
        if (empty($fields)) { $this->respond(400, ['message' => 'Nessun campo valido da aggiornare']); return; }
        $fields[] = 'aggiornato_il = NOW()';
        $params[] = $id;
        try {
            $sql = 'UPDATE articoli SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $this->hub->executeStatement($sql, $params);
            $this->respond(200, ['message' => 'Aggiornato']);
        } catch (Throwable $e) {
            $this->respond(503, ['message' => 'Errore aggiornamento articolo: ' . $e->getMessage()]);
        }
    }

    private function readJson(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $this->respond(400, ['message' => 'JSON non valido']);
            exit;
        }
        return $data;
    }

    private function nullIfEmpty($v) {
        $t = trim((string)($v ?? ''));
        return $t === '' ? null : $t;
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

    private function generateGlobalSku(int $tenantId): array
    {
        // Protocolla richiesta di SKU globale, ottieni ID sequenziale e costruisci codice
        $user = $_SERVER['AUTH_USER'] ?? null;
        $userId = is_array($user) ? ((int)($user['id'] ?? 0) ?: null) : null;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $this->hub->executeStatement(
            'INSERT INTO sku_protocolli (tenant_id, created_by_user_id, created_ip, created_user_agent, created_at) VALUES (?, ?, ?, ?, NOW())',
            [$tenantId, $userId, $ip, $ua]
        );
        $protoId = (int)$this->hub->lastInsertId();
        $code = 'SKU' . str_pad((string)$protoId, 8, '0', STR_PAD_LEFT);
        $this->hub->executeStatement('UPDATE sku_protocolli SET sku_code = ? WHERE id = ?', [$code, $protoId]);
        return [$code, $protoId];
    }
}
