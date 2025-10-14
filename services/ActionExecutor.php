<?php

class ActionExecutor
{
    private Database $db;
    private ?array $currentUser;

    public function __construct(Database $db, ?array $currentUser = null)
    {
        $this->db = $db;
        $this->currentUser = $currentUser;
    }

    /**
     * Esegue l'azione associata a un passo workflow.
     * Non effettua side-effect esterni: restituisce un riepilogo dell'esecuzione simulata/accodata.
     *
     * @param WorkflowStep $step Passo corrente (caricato)
     * @param Task $task Task appena completato (contesto)
     * @return array result payload
     */
    public function executeForStep(WorkflowStep $step, Task $task): array
    {
        $actionId = (int)($step->tipo_azione_standard ?? 0);
        if ($actionId <= 0) {
            return ['status' => 'SKIPPED', 'reason' => 'Nessuna azione'];
        }

        // Carica metadati azione
        $meta = $this->db->selectOne('SELECT codice, nome, handler FROM azioni_standard WHERE id = ?', [$actionId]) ?: [];
        $code = strtoupper((string)($meta['codice'] ?? ''));
        $name = (string)($meta['nome'] ?? '');

        // Parametri del passo
        $params = [];
        if (!empty($step->parametri_azione)) {
            $raw = $step->parametri_azione;
            if (is_string($raw)) {
                $tmp = json_decode($raw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($tmp)) $params = $tmp;
            } elseif (is_array($raw)) {
                $params = $raw;
            }
        }

        $userId = (int)($this->currentUser['id'] ?? 0);
        $now = date(DATE_ATOM);

        // Mappa codici → esecuzioni di servizio (stub)
        $dispatcher = new ServiceDispatcher();
        switch ($code) {
            case 'CREA_ORDINE':
                $res = $dispatcher->createOrder([
                    'customer_id' => $params['cliente_id'] ?? ($params['customer_id'] ?? null),
                    'items' => $params['items'] ?? [],
                    'note' => $params['note'] ?? null,
                ]);
                return ['action' => $code, 'result' => $res, 'user_id' => $userId, 'queued_at' => $now];

            case 'GENERA_DOCUMENTO':
                $res = $dispatcher->createDocument([
                    'type' => strtoupper($params['tipo_documento'] ?? 'FATTURA'),
                    'serie' => $params['serie'] ?? null,
                    'invia_email' => ($params['invia_email'] ?? 'NO') === 'SI',
                ]);
                return ['action' => $code, 'result' => $res, 'user_id' => $userId, 'queued_at' => $now];

            case 'RICHIEDI_PAGAMENTO_DIGITALE':
                $res = $dispatcher->requestPayment(strtoupper($params['gateway'] ?? 'STRIPE'), (float)($params['importo'] ?? 0), $params);
                return ['action' => $code, 'result' => $res, 'user_id' => $userId, 'queued_at' => $now];

            case 'REGISTRA_PAGAMENTO':
                // registrazione pagamento locale non implementata senza schema addizionale: simulazione
                return ['action' => $code, 'status' => 'OK', 'simulated' => true];

            case 'CREA_TICKET':
                $res = $dispatcher->createTicket([
                    'title' => ($params['categoria'] ?? '') ? (($params['categoria']) . ' - Ticket') : 'Ticket',
                    'priority' => strtoupper($params['priorita'] ?? 'MEDIA'),
                ]);
                return ['action' => $code, 'result' => $res, 'user_id' => $userId, 'queued_at' => $now];

            case 'INVIA_SOLLECITO_EMAIL':
                $res = $dispatcher->sendEmail(
                    (string)($params['destinatario_email'] ?? ''),
                    'Sollecito pagamento',
                    (string)($params['messaggio'] ?? 'Gentile cliente, si sollecita il pagamento in ritardo.')
                );
                return ['action' => $code, 'result' => $res, 'user_id' => $userId, 'queued_at' => $now];

            case 'VERIFICA_SCORTE_MAGAZZINO':
            case 'SUGGERISCI_RELATI':
                // per ora simulate-only
                return [
                    'action' => $code,
                    'status' => 'OK',
                    'checked_at' => $now,
                    'details' => $params,
                ];
        }

        return [
            'action' => $code ?: $actionId,
            'status' => 'SKIPPED',
            'reason' => 'Nessun handler definito',
        ];
    }
}
