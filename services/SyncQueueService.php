<?php

require_once __DIR__ . '/../config/Database.php';

class SyncQueueService
{
    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    /**
     * Inserisce o aggiorna un evento nella tabella sync_uscita.
     */
    public function queueEvent(string $entita, string $entitaId, string $tipoEvento, array $payload, string $stato = 'IN_ATTESA'): int
    {
        $entita = strtoupper($entita);
        $tipoEvento = strtoupper($tipoEvento);

        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE);

        // Se esiste già un evento in attesa per stessa entità/id, aggiorniamo payload e tipo evento
        $existing = $this->db->selectOne(
            'SELECT id FROM sync_uscita WHERE entita = ? AND entita_id = ? AND stato = ? ORDER BY creato_il DESC LIMIT 1',
            [$entita, $entitaId, 'IN_ATTESA']
        );

        if ($existing) {
            $this->db->executeStatement(
                'UPDATE sync_uscita SET tipo_evento = ?, payload = ?, creato_il = NOW() WHERE id = ?',
                [$tipoEvento, $payloadJson, (int)$existing['id']]
            );
            return (int)$existing['id'];
        }

        $this->db->executeStatement(
            'INSERT INTO sync_uscita (entita, entita_id, tipo_evento, payload, stato, creato_il)
             VALUES (?, ?, ?, ?, ?, NOW())',
            [$entita, $entitaId, $tipoEvento, $payloadJson, $stato]
        );

        return (int)$this->db->lastInsertId();
    }

    /**
     * Publish/Update articolo nel catalogo condiviso.
     */
    public function queueArticolo(array $articolo, string $tipoEvento = 'AGGIORNA'): int
    {
        $entitaId = $articolo['id_centrale'] ?? $articolo['sku_globale'] ?? $articolo['id_locale'] ?? uniqid('articolo_', true);
        $payload = [
            'evento' => 'ARTICOLO_' . strtoupper($tipoEvento),
            'payload' => ['articolo' => $articolo],
        ];

        return $this->queueEvent('ARTICOLO', (string)$entitaId, $tipoEvento, $payload);
    }

    public function queueVariante(array $variante, string $tipoEvento = 'AGGIORNA'): int
    {
        $entitaId = $variante['id_centrale'] ?? $variante['sku'] ?? $variante['id_locale'] ?? uniqid('variante_', true);
        $payload = [
            'evento' => 'VARIANTE_' . strtoupper($tipoEvento),
            'payload' => ['variante' => $variante],
        ];

        return $this->queueEvent('VARIANTE', (string)$entitaId, $tipoEvento, $payload);
    }

    public function queueScorta(array $scorta): int
    {
        $entitaId = $scorta['id_variante_centrale'] ?? $scorta['variante_id'] ?? uniqid('scorta_', true);
        $payload = [
            'evento' => 'SCORTA_UPDATE',
            'payload' => $scorta,
        ];

        return $this->queueEvent('SCORTA', (string)$entitaId, 'AGGIORNA', $payload);
    }

    public function queuePrezzo(array $prezzo): int
    {
        $entitaId = $prezzo['id_variante_centrale'] ?? $prezzo['variante_id'] ?? uniqid('prezzo_', true);
        $payload = [
            'evento' => 'PREZZO_SET',
            'payload' => $prezzo,
        ];

        return $this->queueEvent('PREZZO', (string)$entitaId, 'SET', $payload);
    }

    public function queueRelazioni(string $articoloRiferimento, array $relazioni, array $opzioni = [], string $tipoEvento = 'SET'): int
    {
        $entitaId = $articoloRiferimento !== '' ? $articoloRiferimento : uniqid('relazione_', true);

        $payloadBody = array_merge(['relazioni' => $relazioni], $opzioni);
        if (!isset($payloadBody['id_articolo_centrale']) && !isset($payloadBody['articolo_sorgente_id']) && !isset($payloadBody['articolo_id'])) {
            $payloadBody['id_articolo_centrale'] = $entitaId;
        }

        $payload = [
            'evento' => 'RELAZIONE_' . strtoupper($tipoEvento),
            'payload' => $payloadBody,
        ];

        return $this->queueEvent('RELAZIONE', (string)$entitaId, $tipoEvento, $payload);
    }

    public function queueBundle(string $articoloRiferimento, array $bundle, array $componenti = [], array $opzioni = [], string $tipoEvento = 'SET'): int
    {
        $entitaId = $articoloRiferimento !== '' ? $articoloRiferimento : uniqid('bundle_', true);

        $payloadBody = array_merge($opzioni, ['bundle' => $bundle]);
        if (!empty($componenti)) {
            $payloadBody['componenti'] = $componenti;
        } elseif (isset($bundle['componenti']) && !isset($payloadBody['componenti'])) {
            $payloadBody['componenti'] = $bundle['componenti'];
        }

        if (!isset($payloadBody['id_articolo_centrale']) && !isset($payloadBody['articolo_id'])) {
            $payloadBody['id_articolo_centrale'] = $entitaId;
        }

        $payload = [
            'evento' => 'BUNDLE_' . strtoupper($tipoEvento),
            'payload' => $payloadBody,
        ];

        return $this->queueEvent('BUNDLE', (string)$entitaId, $tipoEvento, $payload);
    }
}

