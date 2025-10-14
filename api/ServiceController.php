<?php

require_once __DIR__ . '/../services/ServiceDispatcher.php';

class ServiceController
{
    private ?array $currentUser;
    private Database $db;

    public function __construct(Database $db, ?array $currentUser)
    {
        $this->db = $db;
        $this->currentUser = $currentUser;
    }

    public function handle(string $method, ?string $action = null): void
    {
        if (!$action) {
            $this->respond(405, ['message' => 'Metodo o azione non supportati']);
            return;
        }
        // Consenti GET per "status", per tutte le altre azioni richiedi POST
        if ($method !== 'POST' && strtolower($action) !== 'status') {
            $this->respond(405, ['message' => 'Metodo non supportato']);
            return;
        }
        $data = $method === 'POST' ? $this->readJson() : [];
        $now = date(DATE_ATOM);
        $userId = $this->currentUser['id'] ?? null;

        $dispatcher = new ServiceDispatcher();
        switch (strtolower($action)) {
            case 'whatsapp':
                $to = trim((string)($data['to'] ?? ''));
                $msg = (string)($data['message'] ?? '');
                if ($to === '' || $msg === '') {
                    $this->respond(400, ['message' => 'Parametri mancanti: to, message']);
                    return;
                }
                // Verifica configurazione provider WhatsApp
                $waProvider = getenv('WHATSAPP_PROVIDER') ?: null;
                $waWebhook = getenv('SERVICES_WHATSAPP_WEBHOOK') ?: null;
                $waConfigured = false;
                if ($waProvider === 'twilio') {
                    $waConfigured = (bool)(getenv('TWILIO_ACCOUNT_SID') && getenv('TWILIO_AUTH_TOKEN') && getenv('TWILIO_WHATSAPP_FROM'));
                } elseif ($waProvider === 'meta') {
                    $waConfigured = (bool)(getenv('META_WHATSAPP_TOKEN') && getenv('META_WHATSAPP_PHONE_ID'));
                } elseif ($waWebhook) {
                    $waConfigured = true; // invio via webhook custom
                }
                if (!$waConfigured) {
                    $this->respond(400, ['message' => 'Invio WhatsApp non configurato', 'provider' => $waProvider ?: 'none']);
                    return;
                }
                $res = $dispatcher->sendWhatsApp($to, $msg);
                $this->log('whatsapp', 'send', $res, ['to' => $to]);
                $this->respond(200, ['service' => 'whatsapp', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'whatsapp_log':
                // Solo logging manuale per aperture via wa.me / WhatsApp Web/App
                $to = trim((string)($data['to'] ?? ''));
                $msg = (string)($data['message'] ?? '');
                $link = (string)($data['link'] ?? '');
                if ($to === '') { $this->respond(400, ['message' => 'Parametro mancante: to']); return; }
                $result = [ 'ok' => true, 'provider' => 'wa.me', 'code' => null, 'simulated' => true ];
                $this->log('whatsapp', 'manual_open', $result, ['to' => $to, 'message' => $msg, 'link' => $link]);
                $this->respond(200, ['service' => 'whatsapp', 'result' => $result, 'user_id' => $userId, 'logged_at' => $now]);
                return;

            case 'email':
                $to = trim((string)($data['to'] ?? ''));
                $subject = trim((string)($data['subject'] ?? ''));
                $body = (string)($data['body'] ?? '');
                if ($to === '' || $subject === '' || $body === '') {
                    $this->respond(400, ['message' => 'Parametri mancanti: to, subject, body']);
                    return;
                }
                // Verifica configurazione provider email prima di inviare
                $emailProvider = strtolower((string)(getenv('EMAIL_PROVIDER') ?: 'smtp'));
                $emailConfigured = false;
                if ($emailProvider === 'smtp') {
                    $emailConfigured = true; // usa mail() di PHP
                } elseif ($emailProvider === 'mailgun') {
                    $emailConfigured = (bool)(getenv('MAILGUN_API_KEY') && getenv('MAILGUN_DOMAIN'));
                } elseif ($emailProvider === 'sendgrid') {
                    $emailConfigured = (bool)getenv('SENDGRID_API_KEY');
                } elseif ($emailProvider === 'mailup') {
                    $emailConfigured = (bool)getenv('MAILUP_WEBHOOK_URL') || (
                        getenv('MAILUP_CLIENT_ID') && getenv('MAILUP_CLIENT_SECRET') && getenv('MAILUP_USERNAME') && getenv('MAILUP_PASSWORD')
                    );
                }
                if (!$emailConfigured) {
                    $this->respond(400, ['message' => 'Invio email non configurato per il provider selezionato', 'provider' => $emailProvider]);
                    return;
                }
                $res = $dispatcher->sendEmail($to, $subject, $body);
                $this->log('email', 'send', $res, ['to' => $to, 'subject' => $subject]);
                $this->respond(200, ['service' => 'email', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'order':
                $customerId = (string)($data['customer_id'] ?? '');
                $items = $data['items'] ?? [];
                if ($customerId === '' || !is_array($items) || !count($items)) {
                    $this->respond(400, ['message' => 'Parametri mancanti: customer_id, items[]']);
                    return;
                }
                $payload = ['customer_id' => $customerId, 'items' => $items];
                $res = $dispatcher->createOrder($payload);
                $this->log('order', 'create', $res, $payload);
                $this->respond(200, ['service' => 'order', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'document':
                $type = strtoupper((string)($data['type'] ?? ''));
                if (!in_array($type, ['FATTURA','DDT','CONTRATTO'], true)) {
                    $this->respond(400, ['message' => 'type non valido (FATTURA/DDT/CONTRATTO)']);
                    return;
                }
                $payload = ['type' => $type];
                $res = $dispatcher->createDocument($payload);
                $this->log('document', 'create', $res, $payload);
                $this->respond(200, ['service' => 'document', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'payment':
                $gateway = strtoupper((string)($data['gateway'] ?? ''));
                $amount = (float)($data['amount'] ?? 0);
                if ($gateway === '' || $amount <= 0) {
                    $this->respond(400, ['message' => 'Parametri mancanti: gateway, amount>0']);
                    return;
                }
                // Verifica configurazione pagamento
                $paymentWebhook = getenv('PAYMENT_WEBHOOK_URL') ?: null;
                $paymentConfigured = false;
                if ($gateway === 'STRIPE') {
                    $paymentConfigured = (bool)getenv('STRIPE_API_KEY');
                } else {
                    // Per gateway non implementati nativamente richiediamo il webhook
                    $paymentConfigured = (bool)$paymentWebhook;
                }
                if (!$paymentConfigured) {
                    $this->respond(400, ['message' => 'Richiesta pagamento non configurata per il gateway selezionato', 'gateway' => $gateway]);
                    return;
                }
                $res = $dispatcher->requestPayment($gateway, $amount, $data);
                $this->log('payment', 'request', $res, ['gateway' => $gateway, 'amount' => $amount]);
                $this->respond(200, ['service' => 'payment', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'ticket':
                $title = trim((string)($data['title'] ?? ''));
                $priority = strtoupper((string)($data['priority'] ?? ''));
                if ($title === '' || $priority === '') {
                    $this->respond(400, ['message' => 'Parametri mancanti: title, priority']);
                    return;
                }
                $payload = ['title' => $title, 'priority' => $priority];
                $res = $dispatcher->createTicket($payload);
                $this->log('ticket', 'create', $res, $payload);
                $this->respond(200, ['service' => 'ticket', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'chat':
                $channel = trim((string)($data['channel'] ?? 'general'));
                $msg = (string)($data['message'] ?? '');
                if ($msg === '') {
                    $this->respond(400, ['message' => 'Parametri mancanti: message']);
                    return;
                }
                $payload = ['channel' => $channel, 'message' => $msg];
                $res = $dispatcher->sendChat($payload);
                $this->log('chat', 'send', $res, $payload);
                $this->respond(200, ['service' => 'chat', 'result' => $res, 'user_id' => $userId, 'queued_at' => $now]);
                return;

            case 'retry':
                $id = (int)($data['id'] ?? 0);
                if ($id <= 0) { $this->respond(400, ['message' => 'id richiesto']); return; }
                $row = $this->db->selectOne('SELECT * FROM service_logs WHERE id = ?', [$id]);
                if (!$row) { $this->respond(404, ['message' => 'Log non trovato']); return; }
                $payload = json_decode($row['request'] ?? '[]', true) ?: [];
                $service = strtolower((string)($row['service'] ?? ''));
                $res = $this->dispatchService($service, $payload);
                $this->log($service, 'retry', $res, $payload);
                $this->respond(200, ['service' => $service, 'result' => $res]);
                return;

            case 'retry_failed':
                $limit = (int)($data['limit'] ?? 20);
                if ($limit < 1) $limit = 10; if ($limit > 50) $limit = 50;
                $sinceH = (int)($data['since_hours'] ?? 24);
                // Nota: in MySQL/MariaDB non è supportato l'uso di placeholder su INTERVAL/LIMIT
                // con prepared statements nativi. I valori sono già sanitizzati e limitati.
                $sql = "SELECT sl.* FROM service_logs sl
                        LEFT JOIN service_logs ok 
                          ON ok.service = sl.service AND ok.request = sl.request AND ok.status = 'OK' AND ok.created_at > sl.created_at
                        WHERE sl.status = 'ERR' AND sl.created_at >= (NOW() - INTERVAL {$sinceH} HOUR)
                          AND ok.id IS NULL
                        ORDER BY sl.created_at DESC, sl.id DESC
                        LIMIT {$limit}";
                $rows = $this->db->select($sql, []) ?: [];
                $results = [];
                foreach ($rows as $r) {
                    $service = strtolower((string)($r['service'] ?? ''));
                    $payload = json_decode($r['request'] ?? '[]', true) ?: [];
                    $res = $this->dispatchService($service, $payload);
                    $this->log($service, 'retry', $res, $payload);
                    $results[] = ['id' => (int)$r['id'], 'service' => $service, 'ok' => (bool)($res['ok'] ?? false)];
                }
                $this->respond(200, ['count' => count($results), 'items' => $results]);
                return;

            case 'status':
                $waProvider = getenv('WHATSAPP_PROVIDER') ?: null;
                $waWebhook = getenv('SERVICES_WHATSAPP_WEBHOOK') ?: null;
                $waConfigured = false;
                if ($waProvider === 'twilio') {
                    $waConfigured = (bool)(getenv('TWILIO_ACCOUNT_SID') && getenv('TWILIO_AUTH_TOKEN') && getenv('TWILIO_WHATSAPP_FROM'));
                } elseif ($waProvider === 'meta') {
                    $waConfigured = (bool)(getenv('META_WHATSAPP_TOKEN') && getenv('META_WHATSAPP_PHONE_ID'));
                } elseif ($waWebhook) {
                    $waConfigured = true;
                }

                $emailProvider = strtolower((string)(getenv('EMAIL_PROVIDER') ?: 'smtp'));
                $emailFrom = getenv('SMTP_FROM') ?: null;
                $emailConfigured = false;
                if ($emailProvider === 'smtp') {
                    $emailConfigured = true; // usa mail() di PHP
                } elseif ($emailProvider === 'mailgun') {
                    $emailConfigured = (bool)(getenv('MAILGUN_API_KEY') && getenv('MAILGUN_DOMAIN'));
                } elseif ($emailProvider === 'sendgrid') {
                    $emailConfigured = (bool)getenv('SENDGRID_API_KEY');
                } elseif ($emailProvider === 'mailup') {
                    $emailConfigured = (bool)getenv('MAILUP_WEBHOOK_URL') || (
                        getenv('MAILUP_CLIENT_ID') && getenv('MAILUP_CLIENT_SECRET') && getenv('MAILUP_USERNAME') && getenv('MAILUP_PASSWORD')
                    );
                }

                $status = [
                    'whatsapp' => [
                        'provider' => $waProvider,
                        'configured' => $waConfigured,
                    ],
                    'email' => [
                        'provider' => $emailProvider ?: 'smtp',
                        'from' => $emailFrom ?: null,
                        'configured' => $emailConfigured,
                    ],
                    'payment' => [
                        'stripe' => !!getenv('STRIPE_API_KEY'),
                        'currency' => getenv('PAYMENT_CURRENCY') ?: 'EUR',
                    ],
                    'webhooks' => [
                        'order' => !!getenv('ORDER_WEBHOOK_URL'),
                        'document' => !!getenv('DOCUMENT_WEBHOOK_URL'),
                        'payment' => !!getenv('PAYMENT_WEBHOOK_URL'),
                        'ticket' => !!getenv('TICKET_WEBHOOK_URL'),
                        'chat' => !!getenv('CHAT_WEBHOOK_URL'),
                    ],
                ];
                $this->respond(200, ['status' => $status]);
                return;
        
            default:
                $this->respond(404, ['message' => 'Servizio non trovato']);
                return;
        }
    }

    private function readJson(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

    private function log(string $service, string $action, array $result, array $request = []): void
    {
        if ((getenv('SERVICES_LOG') ?: '1') === '0') return;
        try {
            $provider = (string)($result['provider'] ?? ($result['body']['provider'] ?? ''));
            $status = (string)($result['ok'] ?? false) === '1' || $result['ok'] === true ? 'OK' : 'ERR';
            $code = (int)($result['code'] ?? ($result['body']['code'] ?? null));
            $req = json_encode($request, JSON_UNESCAPED_UNICODE);
            $resp = json_encode($result, JSON_UNESCAPED_UNICODE);
            $uid = (int)($this->currentUser['id'] ?? 0);
            $this->db->executeStatement(
                'INSERT INTO service_logs(service, action, provider, status, http_code, request, response, user_id) VALUES (?,?,?,?,?,?,?,?)',
                [$service, $action, $provider ?: null, $status, $code ?: null, $req, $resp, $uid ?: null]
            );
        } catch (Throwable $e) {
            // ignore
        }
    }

    private function dispatchService(string $service, array $payload): array
    {
        $d = new ServiceDispatcher();
        switch ($service) {
            case 'whatsapp': return $d->sendWhatsApp((string)($payload['to'] ?? ''), (string)($payload['message'] ?? ''));
            case 'email': return $d->sendEmail((string)($payload['to'] ?? ''), (string)($payload['subject'] ?? ''), (string)($payload['body'] ?? ''));
            case 'order': return $d->createOrder($payload);
            case 'document': return $d->createDocument($payload);
            case 'payment': return $d->requestPayment((string)($payload['gateway'] ?? ''), (float)($payload['amount'] ?? 0), $payload);
            case 'ticket': return $d->createTicket($payload);
            case 'chat': return $d->sendChat($payload);
        }
        return ['ok' => false, 'error' => 'Servizio non supportato'];
    }
}
