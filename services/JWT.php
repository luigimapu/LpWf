<?php

class JWTException extends Exception {}

class JWT
{
    private const ALG = 'HS256';

    public static function encode(array $payload, string $secret, int $expSeconds = 3600, string $issuer = ''): string
    {
        $header = ['typ' => 'JWT', 'alg' => self::ALG];
        $now = time();
        $payload = array_merge([
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $expSeconds,
        ], $issuer ? ['iss' => $issuer] : [], $payload);

        try {
            $base64Header = self::base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
            $base64Payload = self::base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        } catch (JsonException $e) {
            throw new JWTException('Errore nella serializzazione del token.');
        }

        $signature = hash_hmac('sha256', "$base64Header.$base64Payload", $secret, true);
        $base64Signature = self::base64UrlEncode($signature);

        return "$base64Header.$base64Payload.$base64Signature";
    }

    public static function decode(string $jwt, string $secret, ?string $expectedIssuer = null): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new JWTException('Token non valido: formato errato');
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;
        try {
            $header = json_decode(self::base64UrlDecode($base64Header), true, 512, JSON_THROW_ON_ERROR);
            $payload = json_decode(self::base64UrlDecode($base64Payload), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new JWTException('Token non valido: payload corrotto');
        }

        if (($header['alg'] ?? '') !== self::ALG) {
            throw new JWTException('Algoritmo non supportato');
        }

        $signatureCheck = self::base64UrlEncode(hash_hmac('sha256', "$base64Header.$base64Payload", $secret, true));
        if (!hash_equals($signatureCheck, $base64Signature)) {
            throw new JWTException('Firma non valida');
        }

        $now = time();
        if (isset($payload['nbf']) && $payload['nbf'] > $now) {
            throw new JWTException('Token non ancora valido');
        }
        if (isset($payload['exp']) && $payload['exp'] < $now) {
            throw new JWTException('Token scaduto');
        }
        if ($expectedIssuer !== null && ($payload['iss'] ?? null) !== $expectedIssuer) {
            throw new JWTException('Issuer non valido');
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
