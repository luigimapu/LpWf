<?php
require_once __DIR__ . '/../services/EnrichmentService.php';

class EnrichmentController
{
    private EnrichmentService $service;

    public function __construct()
    {
        $this->service = new EnrichmentService();
    }

    public function handle(string $method, ?string $action): void
    {
        if ($method !== 'GET') {
            $this->respond(405, ['message' => 'Metodo non consentito']);
            return;
        }
        if ($action === 'media' || $action === null) {
            $this->handleMedia();
            return;
        }
        $this->respond(404, ['message' => 'Azione non trovata']);
    }

    private function handleMedia(): void
    {
        $q = trim((string)($_GET['q'] ?? ''));
        if ($q === '') {
            $this->respond(400, ['message' => 'Parametro q mancante']);
            return;
        }
        $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $lang = preg_replace('/[^a-z]/i', '', (string)($_GET['lang'] ?? 'it')) ?: 'it';
        // Opzioni facoltative: providers (csv) e prefer (string)
        $providersCsv = trim((string)($_GET['providers'] ?? ''));
        $prefer = strtolower(trim((string)($_GET['prefer'] ?? '')));
        $providers = [];
        if ($providersCsv !== '') {
            $raw = array_filter(array_map('trim', explode(',', $providersCsv)));
            $allowed = ['wikimedia','unsplash','pexels'];
            foreach ($raw as $p) { $p = strtolower($p); if (in_array($p, $allowed, true)) { $providers[] = $p; } }
            $providers = array_values(array_unique($providers));
        }
        try {
            $opts = [];
            if ($providers) { $opts['providers'] = $providers; }
            if ($prefer) { $opts['prefer'] = $prefer; }
            $items = $this->service->searchMedia($q, $limit, $lang, $opts);
            $this->respond(200, $items);
        } catch (Throwable $e) {
            $this->respond(500, ['message' => 'Errore durante la ricerca media']);
        }
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}
