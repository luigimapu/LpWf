<?php
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/../models/Utente.php';

class AuthException extends Exception {}

class AuthService
{
    private $db;
    private $secret;
    private $issuer;
    private $expSeconds;

    public function __construct(Database $db)
    {
        $this->db = $db;
        $this->secret = getenv('JWT_SECRET') ?: '';
        if ($this->secret === '') {
            throw new RuntimeException('JWT_SECRET non configurato.');
        }

        $this->issuer = getenv('JWT_ISS') ?: '';
        $this->expSeconds = (int)(getenv('JWT_EXP_SECONDS') ?: 3600);
    }

    public function login(string $email, string $password): array
    {
        $utenteModel = new Utente($this->db);
        $user = $utenteModel->findByEmail($email);
        if (!$user || empty($user['password_hash'])) {
            throw new AuthException('Credenziali non valide.');
        }

        if ((int)($user['attivo'] ?? 0) !== 1) {
            throw new AuthException('Utente disattivato.');
        }

        if (!password_verify($password, $user['password_hash'])) {
            throw new AuthException('Credenziali non valide.');
        }

        $payload = [
            'sub' => (int)$user['id'],
            'email' => $user['email'],
            'tenant_id' => $user['tenant_id'] ?? null,
        ];
        $token = JWT::encode($payload, $this->secret, $this->expSeconds, $this->issuer);

        unset($user['password_hash']);

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->expSeconds,
            'user' => $user,
        ];
    }

    public function authenticateRequest(?string $authorizationHeader): array
    {
        if (!$authorizationHeader) {
            throw new AuthException('Header Authorization mancante.');
        }

        if (!preg_match('/Bearer\s+(\S+)/i', $authorizationHeader, $matches)) {
            throw new AuthException('Schema di autenticazione non supportato.');
        }

        $jwt = $matches[1];
        try {
            $payload = JWT::decode($jwt, $this->secret, $this->issuer !== '' ? $this->issuer : null);
        } catch (JWTException $e) {
            throw new AuthException($e->getMessage());
        }

        $userId = (int)($payload['sub'] ?? 0);
        if ($userId <= 0) {
            throw new AuthException('Token non valido: subject mancante.');
        }

        $utente = new Utente($this->db);
        if (!$utente->find($userId)) {
            throw new AuthException('Utente non trovato.');
        }

        if ((int)$utente->attivo !== 1) {
            throw new AuthException('Utente disattivato.');
        }

        return [
            'id' => (int)$utente->id,
            'email' => $utente->email,
            'nome' => $utente->nome,
            'cognome' => $utente->cognome,
            'tenant_id' => $utente->tenant_id ?? ($payload['tenant_id'] ?? null),
        ];
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        $utente = new Utente($this->db);
        if (!$utente->find($userId)) {
            throw new AuthException('Utente non trovato.');
        }

        if (empty($utente->password_hash) || !password_verify($currentPassword, $utente->password_hash)) {
            throw new AuthException('Password corrente non corretta.');
        }

        $this->assertPasswordStrength($newPassword);
        $this->updatePasswordHash($userId, $newPassword);
    }

    public function forceSetPassword(array $currentUser, int $targetUserId, string $newPassword): void
    {
        if ($currentUser['id'] !== $targetUserId) {
            throw new AuthException('Permessi insufficienti per reimpostare la password di altri utenti.');
        }

        $this->assertPasswordStrength($newPassword);
        $this->updatePasswordHash($targetUserId, $newPassword);
    }

    private function updatePasswordHash(int $userId, string $plainPassword): void
    {
        $hash = password_hash($plainPassword, PASSWORD_DEFAULT);
        if ($hash === false) {
            throw new RuntimeException('Impossibile generare hash della password.');
        }

        $updated = $this->db->executeStatement('UPDATE utenti SET password_hash = ? WHERE id = ?', [$hash, $userId]);
        if ($updated === false) {
            throw new RuntimeException('Errore durante l\'aggiornamento della password.');
        }
    }

    private function assertPasswordStrength(string $password): void
    {
        if (strlen($password) < 8) {
            throw new AuthException('La nuova password deve contenere almeno 8 caratteri.');
        }
    }
}
