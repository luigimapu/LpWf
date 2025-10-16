<?php
// CLI: quick test for MailUp send via current environment
// Usage:
//   php tools/test_mailup_send.php --to you@example.com [--sub "Oggetto"] [--body "Contenuto"]

declare(strict_types=1);

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../services/ServiceDispatcher.php';

// Load .env (same of API)
$envPath = __DIR__ . '/../.env';
if (is_readable($envPath)) {
    try { loadEnv($envPath, false); } catch (Throwable $e) { /* ignore */ }
}

// Parse args
$to = null; $sub = 'Test LpWF MailUp'; $body = 'Invio di prova eseguito dal tester CLI.';
foreach ($argv as $arg) {
    if (preg_match('/^--to=(.+)$/', $arg, $m)) { $to = $m[1]; }
    elseif (preg_match('/^--sub=(.+)$/', $arg, $m)) { $sub = $m[1]; }
    elseif (preg_match('/^--body=(.+)$/', $arg, $m)) { $body = $m[1]; }
}
if ($to === null) {
    // Also accept space-separated form: --to you@example.com
    for ($i=1; $i<count($argv)-1; $i++) {
        if ($argv[$i] === '--to') { $to = $argv[$i+1] ?? null; break; }
        if ($argv[$i] === '--sub') { $sub = $argv[$i+1] ?? $sub; }
        if ($argv[$i] === '--body') { $body = $argv[$i+1] ?? $body; }
    }
}

if (!$to) {
    fwrite(STDERR, "Uso: php tools/test_mailup_send.php --to you@example.com [--sub 'Oggetto'] [--body 'Contenuto']\n");
    exit(1);
}

// Force provider mailup
putenv('EMAIL_PROVIDER=mailup');

$disp = new ServiceDispatcher();
$res = $disp->sendEmail($to, (string)$sub, (string)$body);

echo json_encode($res, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), "\n";

