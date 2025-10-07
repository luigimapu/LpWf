<?php

class HttpClient
{
    public static function get(string $url, array $headers = [], int $timeout = 8): array
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        if (!empty($headers)) {
            $formatted = [];
            foreach ($headers as $k => $v) {
                if (is_int($k)) { $formatted[] = $v; } else { $formatted[] = $k . ': ' . $v; }
            }
            curl_setopt($ch, CURLOPT_HTTPHEADER, $formatted);
        }
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($body === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('HTTP request error: ' . $err);
        }
        curl_close($ch);
        return [$status, $body];
    }
}

