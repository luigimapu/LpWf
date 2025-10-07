<?php
require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../services/HttpClient.php';
if (file_exists(__DIR__ . '/../.env')) { loadEnv(__DIR__ . '/../.env', true); }

header('Content-Type: application/json; charset=UTF-8');

$out = [ 'unsplash' => null, 'pexels' => null ];

$q = isset($argv[1]) ? (string)$argv[1] : 'crema mani';

$unsplashKey = getenv('UNSPLASH_ACCESS_KEY') ?: '';
if ($unsplashKey) {
    $url = 'https://api.unsplash.com/search/photos?per_page=1&query=' . urlencode($q) . '&client_id=' . urlencode($unsplashKey);
    [$status, $body] = HttpClient::get($url, ['Accept-Version' => 'v1']);
    $ok = ($status === 200);
    $total = null; $count = null; $err = null;
    if ($ok) {
        $json = json_decode($body, true);
        $total = $json['total'] ?? null;
        $count = is_array($json['results'] ?? null) ? count($json['results']) : null;
    } else { $err = substr($body, 0, 200); }
    $out['unsplash'] = [ 'configured' => true, 'status' => $status, 'ok' => $ok, 'total' => $total, 'count' => $count, 'error' => $err ];
} else {
    $out['unsplash'] = [ 'configured' => false ];
}

$pexelsKey = getenv('PEXELS_API_KEY') ?: '';
if ($pexelsKey) {
    $url = 'https://api.pexels.com/v1/search?per_page=1&query=' . urlencode($q);
    [$status, $body] = HttpClient::get($url, ['Authorization' => $pexelsKey]);
    $ok = ($status === 200);
    $total = null; $count = null; $err = null;
    if ($ok) {
        $json = json_decode($body, true);
        $photos = $json['photos'] ?? [];
        $count = is_array($photos) ? count($photos) : null;
        $total = $json['total_results'] ?? null;
    } else { $err = substr($body, 0, 200); }
    $out['pexels'] = [ 'configured' => true, 'status' => $status, 'ok' => $ok, 'total' => $total, 'count' => $count, 'error' => $err ];
} else {
    $out['pexels'] = [ 'configured' => false ];
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), "\n";

