<?php
// Retry automatico dei servizi falliti negli ultimi N hours, con limite
// Usage: php tools/services_retry.php [--limit=20] [--since=24]

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/ServiceDispatcher.php';

$env = __DIR__ . '/../.env';
if (is_readable($env)) loadEnv($env, true);

function argval($name, $default){
    foreach ($GLOBALS['argv'] as $a) {
        if (strpos($a, "--$name=") === 0) return (int)substr($a, strlen($name)+3);
    }
    return $default;
}

$limit = max(1, min(50, argval('limit', 20)));
$since = max(1, min(168, argval('since', 24))); // fino a 7 giorni

$db = new Database();
$dispatcher = new ServiceDispatcher();

$sql = "SELECT sl.* FROM service_logs sl
        LEFT JOIN service_logs ok
          ON ok.service = sl.service AND ok.request = sl.request AND ok.status = 'OK' AND ok.created_at > sl.created_at
        WHERE sl.status = 'ERR' AND sl.created_at >= (NOW() - INTERVAL {$since} HOUR)
          AND ok.id IS NULL
        ORDER BY sl.created_at DESC, sl.id DESC
        LIMIT {$limit}";
$rows = $db->select($sql, []) ?: [];

if (!$rows) {
    echo "Nessun fallimento recente da ritentare\n";
    exit(0);
}

$count = 0;
foreach ($rows as $r) {
    $service = strtolower((string)($r['service'] ?? ''));
    $payload = json_decode($r['request'] ?? '[]', true) ?: [];
    switch ($service) {
        case 'whatsapp': $res = $dispatcher->sendWhatsApp((string)($payload['to'] ?? ''), (string)($payload['message'] ?? '')); break;
        case 'email': $res = $dispatcher->sendEmail((string)($payload['to'] ?? ''), (string)($payload['subject'] ?? ''), (string)($payload['body'] ?? '')); break;
        case 'order': $res = $dispatcher->createOrder($payload); break;
        case 'document': $res = $dispatcher->createDocument($payload); break;
        case 'payment': $res = $dispatcher->requestPayment((string)($payload['gateway'] ?? ''), (float)($payload['amount'] ?? 0), $payload); break;
        case 'ticket': $res = $dispatcher->createTicket($payload); break;
        case 'chat': $res = $dispatcher->sendChat($payload); break;
        default: $res = ['ok' => false, 'error' => 'Servizio non supportato'];
    }
    $provider = (string)($res['provider'] ?? ($res['body']['provider'] ?? ''));
    $status = ($res['ok'] ?? false) ? 'OK' : 'ERR';
    $code = (int)($res['code'] ?? ($res['body']['code'] ?? null));
    $req = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $resp = json_encode($res, JSON_UNESCAPED_UNICODE);
    $db->executeStatement(
        'INSERT INTO service_logs(service, action, provider, status, http_code, request, response) VALUES (?,?,?,?,?,?,?)',
        [$service, 'retry_cron', $provider ?: null, $status, $code ?: null, $req, $resp]
    );
    $count++;
    echo sprintf("Retry %s id=%d: %s\n", $service, $r['id'], $status);
}

echo "Totale retry: {$count}\n";
