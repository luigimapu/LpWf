<?php

class ServiceDispatcher
{
    private bool $verifySsl;

    public function __construct()
    {
        $v = getenv('SERVICES_VERIFY_SSL');
        $this->verifySsl = !($v === '0' || strtolower((string)$v) === 'false');
    }

    private function curlJson(string $url, string $method, array $payload, array $headers = []): array
    {
        $ch = curl_init($url);
        $json = json_encode($payload);
        $baseHeaders = ['Content-Type: application/json', 'Content-Length: ' . strlen($json)];
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => array_merge($baseHeaders, $headers),
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_TIMEOUT => 20,
        ]);
        if (!$this->verifySsl) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        }
        $body = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false) {
            return ['ok' => false, 'code' => 0, 'error' => $err ?: 'cURL error'];
        }
        $decoded = json_decode($body, true);
        return [
            'ok' => ($code >= 200 && $code < 300),
            'code' => $code,
            'body' => is_array($decoded) ? $decoded : $body,
        ];
    }

    public function sendWhatsApp(string $to, string $message): array
    {
        $provider = strtolower((string)(getenv('WHATSAPP_PROVIDER') ?: ''));
        if ($provider === 'twilio') {
            $sid = getenv('TWILIO_ACCOUNT_SID') ?: '';
            $token = getenv('TWILIO_AUTH_TOKEN') ?: '';
            $from = getenv('TWILIO_WHATSAPP_FROM') ?: '';
            if ($sid && $token && $from) {
                // Twilio richiede prefisso di canale "whatsapp:" su From/To
                $fromWa = stripos($from, 'whatsapp:') === 0 ? $from : ('whatsapp:' . $from);
                $toWa = stripos($to, 'whatsapp:') === 0 ? $to : ('whatsapp:' . $to);
                $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
                $ch = curl_init($url);
                $post = http_build_query([
                    'From' => $fromWa,
                    'To' => $toWa,
                    'Body' => $message,
                ]);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_USERPWD => $sid . ':' . $token,
                    CURLOPT_POSTFIELDS => $post,
                    CURLOPT_TIMEOUT => 20,
                ]);
                if (!$this->verifySsl) {
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                }
                $resp = curl_exec($ch);
                $err = curl_error($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($resp === false) return ['provider' => 'twilio', 'ok' => false, 'error' => $err];
                $body = json_decode($resp, true);
                return ['provider' => 'twilio', 'ok' => $code >= 200 && $code < 300, 'code' => $code, 'body' => $body ?: $resp];
            }
        } elseif ($provider === 'meta') {
            $token = getenv('META_WHATSAPP_TOKEN') ?: '';
            $phoneId = getenv('META_WHATSAPP_PHONE_ID') ?: '';
            if ($token && $phoneId) {
                $url = "https://graph.facebook.com/v19.0/{$phoneId}/messages";
                $tplName = getenv('META_WHATSAPP_TEMPLATE_NAME') ?: '';
                $tplLang = getenv('META_WHATSAPP_TEMPLATE_LANG') ?: 'it';
                if ($tplName !== '') {
                    // Invio come TEMPLATE (necessario per avviare conversazioni fuori dalla finestra 24h)
                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'to' => $to,
                        'type' => 'template',
                        'template' => [
                            'name' => $tplName,
                            'language' => ['code' => $tplLang],
                            // Passa il messaggio come singolo parametro del body (se previsto dal template)
                            'components' => [[
                                'type' => 'body',
                                'parameters' => [[ 'type' => 'text', 'text' => $message ]],
                            ]],
                        ],
                    ];
                } else {
                    // Invio testo libero: richiede conversazione attiva < 24h
                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $to,
                        'type' => 'text',
                        'text' => ['preview_url' => false, 'body' => $message],
                    ];
                }
                $res = $this->curlJson($url, 'POST', $payload, ["Authorization: Bearer {$token}"]);
                $res['provider'] = 'meta';
                return $res;
            }
        }
        $hook = getenv('SERVICES_WHATSAPP_WEBHOOK') ?: '';
        if ($hook) {
            return $this->curlJson($hook, 'POST', ['to' => $to, 'message' => $message]);
        }
        return ['ok' => true, 'simulated' => true];
    }

    public function sendEmail(string $to, string $subject, string $body): array
    {
        $provider = strtolower((string)(getenv('EMAIL_PROVIDER') ?: 'smtp'));
        if ($provider === 'mailgun') {
            $key = getenv('MAILGUN_API_KEY') ?: '';
            $domain = getenv('MAILGUN_DOMAIN') ?: '';
            $from = getenv('SMTP_FROM') ?: 'noreply@example.com';
            if ($key && $domain) {
                $ch = curl_init("https://api.mailgun.net/v3/{$domain}/messages");
                curl_setopt_array($ch, [
                    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
                    CURLOPT_USERPWD => 'api:' . $key,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => [
                        'from' => $from,
                        'to' => $to,
                        'subject' => $subject,
                        'text' => $body,
                    ],
                ]);
                if (!$this->verifySsl) {
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                }
                $resp = curl_exec($ch);
                $err = curl_error($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($resp === false) return ['provider' => 'mailgun', 'ok' => false, 'error' => $err];
                $data = json_decode($resp, true);
                return ['provider' => 'mailgun', 'ok' => $code >= 200 && $code < 300, 'code' => $code, 'body' => $data ?: $resp];
            }
        } elseif ($provider === 'sendgrid') {
            $key = getenv('SENDGRID_API_KEY') ?: '';
            $from = getenv('SMTP_FROM') ?: 'noreply@example.com';
            if ($key) {
                $payload = [
                    'personalizations' => [[ 'to' => [[ 'email' => $to ]] ]],
                    'from' => ['email' => $from],
                    'subject' => $subject,
                    'content' => [[ 'type' => 'text/plain', 'value' => $body ]],
                ];
                return $this->curlJson('https://api.sendgrid.com/v3/mail/send', 'POST', $payload, ["Authorization: Bearer {$key}"]);
            }
        } elseif ($provider === 'mailup') {
            // Opzione A: webhook bridge (consigliato)
            $hook = getenv('MAILUP_WEBHOOK_URL') ?: '';
            $from = getenv('MAILUP_FROM') ?: (getenv('SMTP_FROM') ?: 'noreply@example.com');
            $fromName = getenv('MAILUP_FROM_NAME') ?: '';
            $replyTo = getenv('MAILUP_REPLY_TO') ?: '';
            if ($hook) {
                $payload = [
                    'to' => $to,
                    'subject' => $subject,
                    'text' => $body,
                    'html' => null,
                    'from' => $from,
                    'from_name' => $fromName ?: null,
                    'reply_to' => $replyTo ?: null,
                    'provider' => 'mailup',
                ];
                $res = $this->curlJson($hook, 'POST', $payload);
                $res['provider'] = 'mailup';
                return $this->normalizeMailupResponse($res);
            }

            // Opzione B: integrazione diretta via OAuth MailUp (endpoint configurabile)
            $clientId = getenv('MAILUP_CLIENT_ID') ?: '';
            $clientSecret = getenv('MAILUP_CLIENT_SECRET') ?: '';
            $username = getenv('MAILUP_USERNAME') ?: '';
            $password = getenv('MAILUP_PASSWORD') ?: '';
            $tokenUrl = getenv('MAILUP_TOKEN_URL') ?: 'https://services.mailup.com/Authorization/OAuth/Token';
            $sendUrl = getenv('MAILUP_SEND_URL') ?: '';
            $grant = strtolower((string)(getenv('MAILUP_GRANT_TYPE') ?: 'password'));
            $scope = getenv('MAILUP_SCOPE') ?: '';
            if ($clientId && $clientSecret && $username && $password && $sendUrl) {
                // 1) Ottieni access token (grant password)
                $ch = curl_init($tokenUrl);
                $tokenPayload = [
                    'grant_type' => $grant,
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                ];
                if ($grant === 'password') {
                    $tokenPayload['username'] = $username;
                    $tokenPayload['password'] = $password;
                }
                if ($scope !== '') { $tokenPayload['scope'] = $scope; }
                $post = http_build_query($tokenPayload);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
                    CURLOPT_POSTFIELDS => $post,
                    CURLOPT_TIMEOUT => 25,
                ]);
                if (!$this->verifySsl) {
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                }
                $tokResp = curl_exec($ch);
                $tokErr = curl_error($ch);
                $tokCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($tokResp === false) return ['provider' => 'mailup', 'ok' => false, 'error' => $tokErr ?: 'oauth_error'];
                $tok = json_decode($tokResp, true);
                $access = is_array($tok) ? ($tok['access_token'] ?? '') : '';
                if (!$access || $tokCode < 200 || $tokCode >= 300) {
                    return ['provider' => 'mailup', 'ok' => false, 'code' => $tokCode, 'body' => $tok ?: $tokResp];
                }

                // 2) Invia verso endpoint configurato (varia a seconda del prodotto MailUp adottato)
                $from = getenv('MAILUP_FROM') ?: (getenv('SMTP_FROM') ?: 'noreply@example.com');
                $fromName = getenv('MAILUP_FROM_NAME') ?: '';
                $replyTo = getenv('MAILUP_REPLY_TO') ?: '';
                $payload = [
                    'to' => $to,
                    'subject' => $subject,
                    'text' => $body,
                    'html' => null,
                    'from' => $from,
                    'from_name' => $fromName ?: null,
                    'reply_to' => $replyTo ?: null,
                ];
                $headers = ["Authorization: Bearer {$access}"];
                $res = $this->curlJson($sendUrl, 'POST', $payload, $headers);
                $res['provider'] = 'mailup';
                return $this->normalizeMailupResponse($res);
            }
        } else { // smtp via mail()
            $headers = 'From: ' . (getenv('SMTP_FROM') ?: 'noreply@example.com') . "\r\n" .
                       'MIME-Version: 1.0' . "\r\n" .
                       'Content-Type: text/plain; charset=UTF-8';
            $ok = @mail($to, $subject, $body, $headers);
            return ['provider' => 'smtp', 'ok' => $ok ? true : false];
        }
        return ['ok' => true, 'simulated' => true];
    }

    public function createOrder(array $payload): array
    {
        $hook = getenv('ORDER_WEBHOOK_URL') ?: '';
        if ($hook) {
            return $this->curlJson($hook, 'POST', $payload);
        }
        return ['ok' => true, 'simulated' => true];
    }

    public function createDocument(array $payload): array
    {
        $hook = getenv('DOCUMENT_WEBHOOK_URL') ?: '';
        if ($hook) {
            return $this->curlJson($hook, 'POST', $payload);
        }
        return ['ok' => true, 'simulated' => true];
    }

    public function requestPayment(string $gateway, float $amount, array $extra = []): array
    {
        if (strtoupper($gateway) === 'STRIPE') {
            $key = getenv('STRIPE_API_KEY') ?: '';
            if ($key && $amount > 0) {
                $ch = curl_init('https://api.stripe.com/v1/payment_intents');
                $data = [
                    'amount' => (int)round($amount * 100),
                    'currency' => strtolower(getenv('PAYMENT_CURRENCY') ?: 'eur'),
                    'automatic_payment_methods[enabled]' => 'true',
                ];
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
                    CURLOPT_USERPWD => $key . ':',
                    CURLOPT_POSTFIELDS => http_build_query($data),
                    CURLOPT_TIMEOUT => 20,
                ]);
                if (!$this->verifySsl) {
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                }
                $resp = curl_exec($ch);
                $err = curl_error($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($resp === false) return ['provider' => 'stripe', 'ok' => false, 'error' => $err];
                $data = json_decode($resp, true);
                return ['provider' => 'stripe', 'ok' => $code >= 200 && $code < 300, 'code' => $code, 'body' => $data ?: $resp];
            }
        }
        $hook = getenv('PAYMENT_WEBHOOK_URL') ?: '';
        if ($hook) {
            return $this->curlJson($hook, 'POST', ['gateway' => $gateway, 'amount' => $amount] + $extra);
        }
        return ['ok' => true, 'simulated' => true];
    }

    public function createTicket(array $payload): array
    {
        $hook = getenv('TICKET_WEBHOOK_URL') ?: '';
        if ($hook) {
            return $this->curlJson($hook, 'POST', $payload);
        }
        return ['ok' => true, 'simulated' => true];
    }

    public function sendChat(array $payload): array
    {
        $hook = getenv('CHAT_WEBHOOK_URL') ?: '';
        if ($hook) {
            return $this->curlJson($hook, 'POST', $payload);
        }
        return ['ok' => true, 'simulated' => true];
    }
}

    /**
     * Normalizza alcune risposte MailUp per fornire un esito più leggibile.
     * Ritorna sempre lo stesso shape di base: { ok, code, provider, body, [summary], [id] }
     */
    private function normalizeMailupResponse(array $res): array
    {
        $res['provider'] = 'mailup';
        $body = $res['body'] ?? null;
        if (is_string($body)) {
            $decoded = json_decode($body, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $body = $decoded;
                $res['body'] = $body;
            }
        }
        // Se HTTP non 2xx, lascia ok=false ma aggiungi summary se possibile
        if (isset($res['ok']) && $res['ok'] === false) {
            if (is_array($body)) {
                $msg = $body['error_description'] ?? $body['error'] ?? ($body['message'] ?? ($body['Message'] ?? null));
                if ($msg) { $res['summary'] = 'error: ' . (is_string($msg) ? $msg : json_encode($msg)); }
            }
            return $res;
        }

        // HTTP ok: verifica se il body contiene segnali di errore
        $hasError = false;
        $msg = null;
        if (is_array($body)) {
            if (isset($body['error']) || isset($body['Error']) || isset($body['ErrorCode']) || isset($body['errors']) || isset($body['Errors'])) {
                $hasError = true;
                $msg = $body['error_description'] ?? $body['error'] ?? $body['Error'] ?? null;
                if (!$msg && isset($body['errors']) && is_array($body['errors'])) {
                    $msg = json_encode($body['errors']);
                }
            }
        }
        if ($hasError) {
            $res['ok'] = false;
            if ($msg) { $res['summary'] = 'error: ' . (is_string($msg) ? $msg : json_encode($msg)); }
            return $res;
        }

        // Estrai ID/MessageId/Queued
        if (is_array($body)) {
            $id = $body['id'] ?? $body['Id'] ?? $body['messageId'] ?? $body['MessageId'] ?? null;
            if ($id !== null) { $res['id'] = $id; }
            $status = $body['status'] ?? $body['Status'] ?? null;
            $queued = $body['queued'] ?? $body['Queued'] ?? null;
            if ($queued === true || (is_string($status) && stripos($status, 'queued') !== false)) {
                $res['summary'] = 'queued';
            } else {
                $res['summary'] = 'sent';
            }
        }
        return $res;
    }
