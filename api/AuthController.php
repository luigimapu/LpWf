<?php
require_once __DIR__ . '/../services/AuthService.php';

class AuthController
{
    private $authService;
    private $currentUser = null;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function setCurrentUser(array $user): void
    {
        $this->currentUser = $user;
    }

    public function handle(string $method, ?string $action = null): void
    {
        if ($method === 'POST') {
            if ($action === 'password') {
                $this->changePassword();
                return;
            }
            if ($action === 'password-reset') {
                $this->resetPassword();
                return;
            }
            if ($action === 'logout') {
                $this->logout();
                return;
            }
            if ($action === 'login' || $action === null) {
                $this->login();
                return;
            }
        }

        if ($method === 'GET' && ($action === 'me' || $action === null)) {
            $this->currentUser !== null
                ? $this->sendJson(200, $this->currentUser)
                : $this->sendJson(401, ['message' => 'Utente non autenticato.']);
            return;
        }

        $this->sendJson(405, ['message' => 'Metodo o azione non consentiti per auth.']);
    }

    private function login(): void
    {
        $body = $this->readJsonBody();
        if ($body === null) {
            return;
        }

        $email = trim($body['email'] ?? '');
        $password = (string)($body['password'] ?? '');

        if ($email === '' || $password === '') {
            $this->sendJson(400, ['message' => 'Email e password sono obbligatorie.']);
            return;
        }

        try {
            $result = $this->authService->login($email, $password);
            // Audit: traccia login riuscito
            try {
                $uid = (int)($result['user']['id'] ?? 0);
                $ip = $_SERVER['REMOTE_ADDR'] ?? null;
                $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
                if ($uid > 0) {
                    $this->authService->logAuthEvent($uid, 'LOGIN', $ip, $ua);
                }
            } catch (Throwable $e) { /* ignore */ }
            $this->sendJson(200, $result);
        } catch (AuthException $ex) {
            $this->sendJson(401, ['message' => $ex->getMessage()]);
        } catch (Throwable $ex) {
            $this->sendJson(500, ['message' => 'Errore interno durante il login.']);
        }
    }

    private function changePassword(): void
    {
        if ($this->currentUser === null) {
            $this->sendJson(401, ['message' => 'Autenticazione richiesta.']);
            return;
        }

        $body = $this->readJsonBody();
        if ($body === null) {
            return;
        }

        $currentPassword = (string)($body['current_password'] ?? '');
        $newPassword = (string)($body['new_password'] ?? '');

        if ($currentPassword === '' || $newPassword === '') {
            $this->sendJson(400, ['message' => 'Password corrente e nuova password sono obbligatorie.']);
            return;
        }

        try {
            $this->authService->changePassword((int)$this->currentUser['id'], $currentPassword, $newPassword);
            $this->sendJson(200, ['message' => 'Password aggiornata con successo.']);
        } catch (AuthException $ex) {
            $this->sendJson(400, ['message' => $ex->getMessage()]);
        } catch (Throwable $ex) {
            $this->sendJson(500, ['message' => 'Errore durante l\'aggiornamento della password.']);
        }
    }

    private function resetPassword(): void
    {
        if ($this->currentUser === null) {
            $this->sendJson(401, ['message' => 'Autenticazione richiesta.']);
            return;
        }

        $body = $this->readJsonBody();
        if ($body === null) {
            return;
        }

        $targetUserId = (int)($body['user_id'] ?? 0);
        $newPassword = (string)($body['new_password'] ?? '');

        if ($targetUserId <= 0 || $newPassword === '') {
            $this->sendJson(400, ['message' => 'user_id e new_password sono obbligatori.']);
            return;
        }

        try {
            $this->authService->forceSetPassword($this->currentUser, $targetUserId, $newPassword);
            $this->sendJson(200, ['message' => 'Password aggiornata con successo.']);
        } catch (AuthException $ex) {
            $this->sendJson(403, ['message' => $ex->getMessage()]);
        } catch (Throwable $ex) {
            $this->sendJson(500, ['message' => 'Errore durante il reset della password.']);
        }
    }

    private function logout(): void
    {
        // Con JWT stateless non c'è invalidazione server-side di default.
        // Tracciamo comunque l'evento in audit.
        try {
            $uid = (int)($this->currentUser['id'] ?? 0);
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
            if ($uid > 0) {
                $this->authService->logAuthEvent($uid, 'LOGOUT', $ip, $ua);
            }
        } catch (Throwable $e) { /* ignore */ }
        $this->sendJson(200, ['message' => 'Logout eseguito.']);
    }

    private function readJsonBody(): ?array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendJson(400, ['message' => 'JSON non valido.']);
            return null;
        }
        return $data;
    }

    private function sendJson(int $status, array $payload): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}
