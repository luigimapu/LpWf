<?php

require_once __DIR__ . '/../config/Database.php';

class SyncService
{
    private const ENDPOINT_MAP = [
        'ARTICOLO'      => '/sync/articoli',
        'VARIANTE'      => '/sync/varianti',
        'RELAZIONE'     => '/sync/relazioni',
        'BUNDLE'        => '/sync/bundle',
        'SCORTA'        => '/sync/scorte',
        'PREZZO'        => '/sync/prezzi',
        'DISPONIBILITA' => '/sync/disponibilita',
        'DOCUMENTO'     => '/sync/documenti',
        'ALTRO'         => '/sync/generic',
    ];

    private Database $db;
    private string $hubBaseUrl;
    private string $apiKey;
    private ?string $tenantId;

    public function __construct(Database $db)
    {
        $this->db = $db;
        $base = getenv('HUB_API_BASE') ?: '';
        $key = getenv('HUB_API_KEY') ?: '';

        if ($base === '' || $key === '') {
            throw new RuntimeException('Configurazione HUB_API_BASE o HUB_API_KEY mancante.');
        }

        $this->hubBaseUrl = rtrim($base, '/');
        $this->apiKey = $key;
        $this->tenantId = getenv('TENANT_ID') ?: null;
    }

    /**
     * Invia gli eventi in stato IN_ATTESA all'hub centrale.
     * @return array riepilogo per ogni evento elaborato
     */
    public function pushPendingEvents(int $limit = 50): array
    {
        $events = $this->db->select(
            'SELECT * FROM sync_uscita WHERE stato = ? ORDER BY creato_il ASC LIMIT ?',
            ['IN_ATTESA', $limit]
        );

        if (!$events) {
            return [];
        }

        $results = [];
        foreach ($events as $event) {
            $result = $this->pushSingleEvent($event);
            $results[] = $result;
        }

        return $results;
    }

    private function pushSingleEvent(array $event): array
    {
        $eventId = (int)$event['id'];
        $payload = $this->decodePayload($event['payload'] ?? '{}');
        $endpoint = $this->resolveEndpoint($event['entita']);

        $body = $this->buildBody($event, $payload);

        [$status, $response, $error] = $this->sendRequest($endpoint, $body);

        $logStatus = $status ? 'OK' : 'ERRORE';
        $message = $status ? ($response['esito'] ?? 'OK') : ($error ?: 'Errore generico');

        $this->writeLog($eventId, $event, $logStatus, $message);
        $this->updateEventState($eventId, $status, $message);

        return [
            'id' => $eventId,
            'entita' => $event['entita'],
            'tipo_evento' => $event['tipo_evento'],
            'successo' => $status,
            'messaggio' => $message,
        ];
    }

    private function decodePayload(string $json): array
    {
        $data = json_decode($json, true);
        return is_array($data) ? $data : [];
    }

    private function resolveEndpoint(string $entity): string
    {
        $upper = strtoupper($entity);
        return self::ENDPOINT_MAP[$upper] ?? self::ENDPOINT_MAP['ALTRO'];
    }

    private function buildBody(array $event, array $payload): array
    {
        // Se il payload contiene già evento/tenant_id in formato completo lo utilizziamo così com'è
        if (isset($payload['evento']) && isset($payload['payload'])) {
            if (!isset($payload['tenant_id']) && $this->tenantId) {
                $payload['tenant_id'] = $this->tenantId;
            }
            return $payload;
        }

        $evento = $event['entita'] . '_' . $event['tipo_evento'];

        return [
            'tenant_id' => $this->tenantId,
            'evento' => $evento,
            'versione' => $event['creato_il'] ?? date(DATE_ATOM),
            'payload' => $payload,
        ];
    }

    private function sendRequest(string $endpoint, array $body): array
    {
        $url = $this->hubBaseUrl . $endpoint;
        if (str_contains($this->hubBaseUrl, '?') && !str_contains($url, 'token=')) {
            $separator = (str_ends_with($url, '?') || str_ends_with($url, '&')) ? '' : '&';
            $url .= $separator . 'token=' . urlencode($this->apiKey);
        }
        $ch = curl_init($url);

        $payloadJson = json_encode($body);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Length: ' . strlen($payloadJson),
            ],
            CURLOPT_POSTFIELDS => $payloadJson,
            CURLOPT_TIMEOUT => 15,
        ]);

        $verify = getenv('HUB_API_VERIFY_SSL');
        if ($verify === '0' || strtolower((string)$verify) === 'false') {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        }

        $responseBody = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($responseBody === false) {
            return [false, [], $curlError ?: 'Errore cURL'];
        }

        $decoded = json_decode($responseBody, true);
        if ($httpCode >= 200 && $httpCode < 300) {
            return [true, is_array($decoded) ? $decoded : [], null];
        }

        $errorMessage = $decoded['errore']['messaggio'] ?? $decoded['message'] ?? $responseBody;
        return [false, is_array($decoded) ? $decoded : [], $errorMessage];
    }

    private function updateEventState(int $eventId, bool $success, string $message): void
    {
        $stato = $success ? 'INVIATO' : 'ERRORE';
        $params = [$stato, $message, $eventId];
        $sql = 'UPDATE sync_uscita SET stato = ?, ultimo_tentativo_il = NOW(), tentativi = tentativi + 1, errore = ? WHERE id = ?';
        $this->db->executeStatement($sql, $params);
    }

    private function writeLog(int $eventId, array $event, string $status, string $message): void
    {
        $sql = 'INSERT INTO log_sync (sync_uscita_id, entita, entita_id, direzione, stato, messaggio)
                VALUES (?, ?, ?, ?, ?, ?)';
        $this->db->executeStatement($sql, [
            $eventId,
            $event['entita'],
            $event['entita_id'],
            'VERSO_HUB',
            $status,
            mb_substr($message, 0, 500)
        ]);
    }
}
