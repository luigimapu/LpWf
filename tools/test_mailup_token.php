<?php
// CLI: debug OAuth MailUp token
// Usage: php tools/test_mailup_token.php

declare(strict_types=1);

require_once __DIR__ . '/../config/env_loader.php';

$envPath = __DIR__ . '/../.env';
if (is_readable($envPath)) {
    try { loadEnv($envPath, false); } catch (Throwable $e) { /* ignore */ }
}

function http_post_form(string $url, array $fields, array $headers = []): array {
    $ch = curl_init($url);
    $post = http_build_query($fields);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers ?: ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_POSTFIELDS => $post,
        CURLOPT_TIMEOUT => 25,
    ]);
    $resp = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $resp, $err];
}

$clientId = getenv('MAILUP_CLIENT_ID') ?: '';
$clientSecret = getenv('MAILUP_CLIENT_SECRET') ?: '';
$username = getenv('MAILUP_USERNAME') ?: '';
$password = getenv('MAILUP_PASSWORD') ?: '';
$tokenUrl = getenv('MAILUP_TOKEN_URL') ?: 'https://services.mailup.com/Authorization/OAuth/Token';
$grant = strtolower((string)(getenv('MAILUP_GRANT_TYPE') ?: 'password'));
$scope = getenv('MAILUP_SCOPE') ?: '';

if (!$clientId || !$clientSecret) {
    fwrite(STDERR, "MAILUP_CLIENT_ID/SECRET mancanti in .env\n");
    exit(1);
}

$fields = [ 'grant_type' => $grant ];
if ($grant === 'password') {
    if (!$username || !$password) { fwrite(STDERR, "MAILUP_USERNAME/PASSWORD mancanti per grant password\n"); exit(1); }
    $fields['username'] = $username;
    $fields['password'] = $password;
}
if ($scope !== '') { $fields['scope'] = $scope; }

$basic = base64_encode($clientId . ':' . $clientSecret);
[$code, $body, $err] = http_post_form($tokenUrl, $fields, [
    'Content-Type: application/x-www-form-urlencoded',
    'Authorization: Basic ' . $basic,
]);

$out = [ 'code' => $code, 'error' => $err ?: null ];
if ($body !== false) {
    $json = json_decode((string)$body, true);
    $out['body'] = is_array($json) ? $json : $body;
}
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), "\n";

