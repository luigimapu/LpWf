<?php

require_once __DIR__ . '/../config/HubDatabase.php';

class HubEventProcessor
{
    private HubDatabase $db;

    public function __construct(HubDatabase $db)
    {
        $this->db = $db;
    }

    /**
     * Elabora gli eventi in `eventi_sync` con stato IN_ATTESA.
     * @return array elenco dei risultati (id, entita, successo, messaggio)
     */
    public function processPendingEvents(int $limit = 50): array
    {
        $events = $this->db->select(
            'SELECT * FROM eventi_sync WHERE stato_elaborazione = ? ORDER BY creato_il ASC, id ASC LIMIT ?',
            ['IN_ATTESA', $limit]
        );

        if (!$events) {
            return [];
        }

        $results = [];
        foreach ($events as $event) {
            $results[] = $this->processSingleEvent($event);
        }

        return $results;
    }

    private function processSingleEvent(array $event): array
    {
        $eventId = (int) $event['id'];
        $success = true;
        $message = 'Elaborato';

        try {
            $payload = $this->decodePayload($event['payload'] ?? '{}');
        } catch (Throwable $e) {
            $success = false;
            $message = 'Payload non valido: ' . $e->getMessage();
            $payload = [];
        }

        if ($success) {
            try {
                switch ($event['entita']) {
                    case 'ARTICOLO':
                        $this->handleArticolo($event, $payload);
                        $message = $event['tipo_evento'] === 'ELIMINA' ? 'Articolo archiviato' : 'Articolo aggiornato';
                        break;
                    case 'VARIANTE':
                        $this->handleVariante($event, $payload);
                        $message = 'Varianti sincronizzate';
                        break;
                    case 'SCORTA':
                        $this->handleScorta($event, $payload);
                        $message = 'Scorta aggiornata';
                        break;
                    case 'PREZZO':
                        $this->handlePrezzo($event, $payload);
                        $message = 'Prezzi aggiornati';
                        break;
                    case 'DISPONIBILITA':
                        $this->handleDisponibilita($event, $payload);
                        $message = 'Disponibilità aggiornata';
                        break;
                    case 'RELAZIONE':
                        $this->handleRelazioni($event, $payload);
                        $message = $event['tipo_evento'] === 'ELIMINA' ? 'Relazioni rimosse' : 'Relazioni aggiornate';
                        break;
                    case 'BUNDLE':
                        $this->handleBundle($event, $payload);
                        $message = $event['tipo_evento'] === 'ELIMINA' ? 'Bundle eliminato' : 'Bundle aggiornato';
                        break;
                    default:
                        $message = 'Evento registrato (nessuna azione specifica)';
                        break;
                }
            } catch (Throwable $e) {
                $success = false;
                $message = $e->getMessage();
            }
        }

        $this->updateEventState($eventId, $success, $message);

        return [
            'id' => $eventId,
            'entita' => $event['entita'],
            'successo' => $success,
            'messaggio' => $message,
        ];
    }

    private function decodePayload(string $json): array
    {
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : [];
    }

    private function handleArticolo(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $articoloPayload = $payload['articolo'] ?? $payload;

        $sku = $articoloPayload['sku_globale']
            ?? $articoloPayload['id_centrale']
            ?? $articoloPayload['id_locale']
            ?? $event['entita_id'];

        if ($tenantId === 0 || !$sku) {
            throw new RuntimeException('Dati articolo mancanti (tenant_id o sku).');
        }

        if ($event['tipo_evento'] === 'ELIMINA') {
            $this->db->executeStatement(
                'UPDATE articoli SET stato_pubblicazione = ?, deleted_il = NOW(), aggiornato_il = NOW() WHERE tenant_id = ? AND sku_globale = ?',
                ['ARCHIVIATO', $tenantId, $sku]
            );
            return;
        }

        $titolo = $articoloPayload['titolo'] ?? $sku;
        $sottotitolo = $articoloPayload['sottotitolo'] ?? null;
        $descrizione = $articoloPayload['descrizione'] ?? null;
        $tipologia = $articoloPayload['tipologia'] ?? 'SERVIZIO';
        $stato = $articoloPayload['stato_pubblicazione'] ?? 'PUBBLICATO';
        $visibilita = $articoloPayload['visibilita'] ?? 'MARKETPLACE';
        $setAttributi = $articoloPayload['set_attributi_id'] ?? null;

        $metadati = null;
        if (isset($articoloPayload['metadati'])) {
            $metadati = json_encode($articoloPayload['metadati'], JSON_UNESCAPED_UNICODE);
        } elseif (!empty($payload)) {
            $metadati = json_encode($payload, JSON_UNESCAPED_UNICODE);
        }

        $sql = 'INSERT INTO articoli (
                    tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione,
                    stato_pubblicazione, visibilita, set_attributi_id, metadati, pubblica_il
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    tipologia = VALUES(tipologia),
                    titolo = VALUES(titolo),
                    sottotitolo = VALUES(sottotitolo),
                    descrizione = VALUES(descrizione),
                    stato_pubblicazione = VALUES(stato_pubblicazione),
                    visibilita = VALUES(visibilita),
                    set_attributi_id = VALUES(set_attributi_id),
                    metadati = VALUES(metadati),
                    deleted_il = NULL,
                    aggiornato_il = NOW()';

        $this->db->executeStatement($sql, [
            $tenantId,
            $sku,
            mb_substr($tipologia, 0, 20),
            $titolo,
            $sottotitolo,
            $descrizione,
            $stato,
            $visibilita,
            $setAttributi,
            $metadati,
        ]);
    }

    private function handleVariante(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $tipoEvento = $event['tipo_evento'];
        $varianti = $this->normalizeVariantiPayload($payload);

        if (empty($varianti)) {
            throw new RuntimeException('Payload variante vuoto.');
        }

        foreach ($varianti as $varianteData) {
            $sku = $varianteData['sku'] ?? $varianteData['id_centrale'] ?? $varianteData['id_locale'] ?? null;
            if (!$sku) {
                throw new RuntimeException('SKU variante mancante.');
            }

            $articoloId = $this->resolveArticoloId($tenantId, $varianteData, $event);
            if ($articoloId === null) {
                throw new RuntimeException('Articolo associato alla variante non trovato.');
            }

            if ($tipoEvento === 'ELIMINA' || ($varianteData['azione'] ?? null) === 'DELETE') {
                $this->db->executeStatement(
                    'UPDATE articoli_varianti SET stato = ?, deleted_il = NOW(), aggiornato_il = NOW() WHERE sku = ? AND articolo_id = ?',
                    ['INATTIVO', $sku, $articoloId]
                );
                continue;
            }

            $nome = $varianteData['nome'] ?? $sku;
            $stato = $varianteData['stato'] ?? 'ATTIVO';
            $attributiOverride = isset($varianteData['attributi'])
                ? json_encode($varianteData['attributi'], JSON_UNESCAPED_UNICODE)
                : null;

            $sql = 'INSERT INTO articoli_varianti (articolo_id, sku, nome, attributi_override, stato)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        articolo_id = VALUES(articolo_id),
                        nome = VALUES(nome),
                        attributi_override = VALUES(attributi_override),
                        stato = VALUES(stato),
                        deleted_il = NULL,
                        aggiornato_il = NOW()';

            $this->db->executeStatement($sql, [
                $articoloId,
                $sku,
                $nome,
                $attributiOverride,
                $stato,
            ]);
        }
    }

    private function handleScorta(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $varianteId = $this->resolveVarianteId($tenantId, $payload, $event);
        if ($varianteId === null) {
            throw new RuntimeException('Variante per scorta non trovata.');
        }

        $magazzino = $payload['magazzino'] ?? $payload['magazzino_id'] ?? '';
        $quantitaTot = (float) ($payload['quantita_totale'] ?? 0);
        $quantitaRiservata = (float) ($payload['quantita_riservata'] ?? 0);
        $quantitaDisp = $payload['quantita_disponibile'] ?? ($quantitaTot - $quantitaRiservata);
        $versione = (int) ($payload['versione_sync'] ?? $payload['versione'] ?? 0);

        if ($event['tipo_evento'] === 'ELIMINA') {
            $this->db->executeStatement(
                'DELETE FROM scorte WHERE variante_id = ? AND tenant_id = ? AND magazzino_id = ?',
                [$varianteId, $tenantId, $magazzino]
            );
            return;
        }

        $sql = 'INSERT INTO scorte (variante_id, tenant_id, magazzino_id, quantita_totale, quantita_riservata, quantita_disponibile, versione_sync, aggiornato_il)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    quantita_totale = VALUES(quantita_totale),
                    quantita_riservata = VALUES(quantita_riservata),
                    quantita_disponibile = VALUES(quantita_disponibile),
                    versione_sync = GREATEST(versione_sync, VALUES(versione_sync)),
                    aggiornato_il = NOW()';

        $this->db->executeStatement($sql, [
            $varianteId,
            $tenantId,
            $magazzino,
            $quantitaTot,
            $quantitaRiservata,
            $quantitaDisp,
            $versione,
        ]);
    }

    private function handlePrezzo(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $listino = $payload['listino'] ?? [];
        $prezzi = $payload['prezzi'] ?? [];

        if (empty($listino) || empty($prezzi)) {
            throw new RuntimeException('Listino o prezzi mancanti nel payload.');
        }

        $codice = $listino['codice'] ?? null;
        if (!$codice) {
            throw new RuntimeException('Codice listino mancante.');
        }

        $listinoId = $this->upsertListino($tenantId, $listino);

        foreach ($prezzi as $entry) {
            $varianteId = $this->resolveVarianteId($tenantId, $entry, $event);
            if ($varianteId === null) {
                throw new RuntimeException('Variante per prezzo non trovata.');
            }

            if ($event['tipo_evento'] === 'ELIMINA' || ($entry['azione'] ?? null) === 'DELETE') {
                $this->db->executeStatement(
                    'DELETE FROM prezzi_articoli WHERE listino_id = ? AND variante_id = ?',
                    [$listinoId, $varianteId]
                );
                continue;
            }

            $sql = 'INSERT INTO prezzi_articoli (
                        listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima, quantita_massima, condizioni
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        prezzo = VALUES(prezzo),
                        prezzo_confronto = VALUES(prezzo_confronto),
                        quantita_minima = VALUES(quantita_minima),
                        quantita_massima = VALUES(quantita_massima),
                        condizioni = VALUES(condizioni),
                        aggiornato_il = NOW()';

            $this->db->executeStatement($sql, [
                $listinoId,
                $varianteId,
                $entry['prezzo'] ?? 0,
                $entry['prezzo_confronto'] ?? null,
                $entry['quantita_minima'] ?? null,
                $entry['quantita_massima'] ?? null,
                isset($entry['condizioni']) ? json_encode($entry['condizioni'], JSON_UNESCAPED_UNICODE) : null,
            ]);
        }
    }

    private function handleDisponibilita(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $varianteId = $this->resolveVarianteId($tenantId, $payload, $event);
        if ($varianteId === null) {
            throw new RuntimeException('Variante per disponibilità non trovata.');
        }

        $modalita = strtoupper($payload['modalita'] ?? 'MERGE');
        $slots = $payload['slot'] ?? [];
        if (!is_array($slots) || count($slots) === 0) {
            throw new RuntimeException('Nessuno slot di disponibilità fornito.');
        }

        if ($modalita === 'REPLACE') {
            $this->db->executeStatement(
                'DELETE FROM disponibilita_slot WHERE variante_id = ?',
                [$varianteId]
            );
        }

        foreach ($slots as $slot) {
            $inizio = $this->parseDateTime($slot['inizio'] ?? null);
            $fine = $this->parseDateTime($slot['fine'] ?? null);
            $capacita = (int) ($slot['capacita'] ?? $slot['capacita_totale'] ?? 1);
            $prenotata = (int) ($slot['capacita_prenotata'] ?? 0);

            if (!$inizio || !$fine) {
                throw new RuntimeException('Slot disponibilità privo di date valide.');
            }

            if ($event['tipo_evento'] === 'ELIMINA') {
                $this->db->executeStatement(
                    'DELETE FROM disponibilita_slot WHERE variante_id = ? AND inizio = ? AND fine = ?',
                    [$varianteId, $inizio, $fine]
                );
                continue;
            }

            $sql = 'INSERT INTO disponibilita_slot (variante_id, inizio, fine, capacita_totale, capacita_prenotata, aggiornato_il)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                        capacita_totale = VALUES(capacita_totale),
                        capacita_prenotata = VALUES(capacita_prenotata),
                        aggiornato_il = NOW()';

            $this->db->executeStatement($sql, [
                $varianteId,
                $inizio,
                $fine,
                $capacita,
                $prenotata,
            ]);
        }
    }

    private function handleRelazioni(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $articoloId = $this->resolveArticoloIdFromData($tenantId, $payload, $event, true);

        if ($articoloId === null) {
            throw new RuntimeException('Articolo sorgente per relazioni non trovato.');
        }

        $relazioni = $payload['relazioni'] ?? [];
        if (!is_array($relazioni)) {
            throw new RuntimeException('Formato relazioni non valido.');
        }

        if ($event['tipo_evento'] === 'ELIMINA') {
            if (count($relazioni) === 0) {
                $this->db->executeStatement(
                    'DELETE FROM articoli_relazioni WHERE articolo_sorgente_id = ?',
                    [$articoloId]
                );
                return;
            }

            foreach ($relazioni as $relazione) {
                $tipo = strtoupper($relazione['tipo'] ?? '');
                $targetId = $this->resolveArticoloIdByReference($relazione, null, false);

                if ($tipo === '' || $targetId === null) {
                    throw new RuntimeException('Relazione da eliminare non valida (tipo o articolo correlato mancante).');
                }

                $this->db->executeStatement(
                    'DELETE FROM articoli_relazioni WHERE articolo_sorgente_id = ? AND articolo_correlato_id = ? AND tipo_relazione = ?',
                    [$articoloId, $targetId, $tipo]
                );
            }

            return;
        }

        $modalita = strtoupper($payload['modalita'] ?? 'REPLACE');
        if ($modalita === 'REPLACE') {
            $this->db->executeStatement(
                'DELETE FROM articoli_relazioni WHERE articolo_sorgente_id = ?',
                [$articoloId]
            );
        }

        foreach ($relazioni as $relazione) {
            $tipo = strtoupper($relazione['tipo'] ?? '');
            if ($tipo === '') {
                throw new RuntimeException('Tipo relazione mancante.');
            }

            $targetId = $this->resolveArticoloIdByReference($relazione, null, false);
            if ($targetId === null) {
                throw new RuntimeException('Articolo correlato non trovato per relazione.');
            }

            $priorita = (int) ($relazione['priorita'] ?? 0);

            $this->db->executeStatement(
                'INSERT INTO articoli_relazioni (articolo_sorgente_id, articolo_correlato_id, tipo_relazione, priorita)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE priorita = VALUES(priorita)',
                [$articoloId, $targetId, $tipo, $priorita]
            );
        }
    }

    private function handleBundle(array $event, array $payload): void
    {
        $tenantId = (int) $event['tenant_id'];
        $articoloId = $this->resolveArticoloIdFromData($tenantId, $payload, $event, true);

        if ($articoloId === null) {
            throw new RuntimeException('Articolo bundle non trovato.');
        }

        if ($event['tipo_evento'] === 'ELIMINA') {
            $bundleRow = $this->db->selectOne(
                'SELECT id FROM bundle WHERE articolo_id = ?',
                [$articoloId]
            );

            if ($bundleRow) {
                $bundleId = (int) $bundleRow['id'];
                $this->db->executeStatement('DELETE FROM bundle_componenti WHERE bundle_id = ?', [$bundleId]);
                $this->db->executeStatement('DELETE FROM bundle WHERE id = ?', [$bundleId]);
            }

            return;
        }

        $bundleData = $payload['bundle'] ?? [];
        $strategia = strtoupper($bundleData['strategia_prezzo'] ?? 'FISSO');
        if (!in_array($strategia, ['FISSO', 'DINAMICO', 'SCONTO_PERCENTUALE'], true)) {
            $strategia = 'FISSO';
        }
        $prezzoBundle = array_key_exists('prezzo_bundle', $bundleData) ? (float) $bundleData['prezzo_bundle'] : null;

        $this->db->executeStatement(
            'INSERT INTO bundle (articolo_id, strategia_prezzo, prezzo_bundle)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE strategia_prezzo = VALUES(strategia_prezzo), prezzo_bundle = VALUES(prezzo_bundle), aggiornato_il = NOW()',
            [$articoloId, $strategia, $prezzoBundle]
        );

        $bundleRow = $this->db->selectOne(
            'SELECT id FROM bundle WHERE articolo_id = ?',
            [$articoloId]
        );

        if (!$bundleRow) {
            throw new RuntimeException('Impossibile recuperare il bundle sincronizzato.');
        }

        $bundleId = (int) $bundleRow['id'];
        $componenti = $payload['componenti'] ?? ($bundleData['componenti'] ?? []);
        if (!is_array($componenti)) {
            throw new RuntimeException('Formato componenti bundle non valido.');
        }

        $modalita = strtoupper($payload['modalita_componenti'] ?? $payload['modalita'] ?? 'REPLACE');
        if ($modalita === 'REPLACE') {
            $this->db->executeStatement('DELETE FROM bundle_componenti WHERE bundle_id = ?', [$bundleId]);
        }

        foreach ($componenti as $componente) {
            $componentId = $this->resolveArticoloIdByReference($componente, null, false);
            if ($componentId === null) {
                throw new RuntimeException('Articolo componente bundle non trovato.');
            }

            $quantita = isset($componente['quantita']) ? (float) $componente['quantita'] : 1.0;
            $opzionale = !empty($componente['opzionale']) ? 1 : 0;
            $preselezionato = !empty($componente['preselezionato']) ? 1 : 0;

            $this->db->executeStatement(
                'INSERT INTO bundle_componenti (bundle_id, articolo_component_id, quantita, opzionale, preselezionato)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantita = VALUES(quantita), opzionale = VALUES(opzionale), preselezionato = VALUES(preselezionato)',
                [$bundleId, $componentId, $quantita, $opzionale, $preselezionato]
            );
        }
    }


    private function updateEventState(int $eventId, bool $success, string $message): void
    {
        $stato = $success ? 'ELABORATO' : 'ERRORE';
        $errore = $success ? null : mb_substr($message, 0, 500);
        $sql = 'UPDATE eventi_sync SET stato_elaborazione = ?, elaborato_il = NOW(), errore = ? WHERE id = ?';
        $this->db->executeStatement($sql, [$stato, $errore, $eventId]);
    }

    private function resolveArticoloId(int $tenantId, array $varianteData, array $event): ?int
    {
        return $this->resolveArticoloIdFromData($tenantId, $varianteData, $event, true);
    }

    private function resolveArticoloIdFromData(int $tenantId, array $data, array $event, bool $restrictTenant = true): ?int
    {
        $candidates = [
            $data['id_articolo_centrale'] ?? null,
            $data['articolo_id'] ?? null,
            $data['articolo'] ?? null,
            $data['articolo_sorgente_id'] ?? null,
            $data['articolo_sku'] ?? null,
            $data['articolo_sku_globale'] ?? null,
            $data['sku_articolo'] ?? null,
            $data['sku_globale'] ?? null,
            $data['sku'] ?? null,
            $data['id_locale'] ?? null,
            $event['entita_id'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            $resolved = $this->resolveArticoloIdByReference($candidate, $tenantId, $restrictTenant);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return null;
    }

    private function resolveArticoloIdByReference($reference, ?int $tenantId = null, bool $restrictTenant = true): ?int
    {
        if ($reference === null) {
            return null;
        }

        if (is_array($reference)) {
            $keys = [
                'id_centrale',
                'id_articolo_centrale',
                'articolo_id',
                'articolo',
                'articolo_correlato',
                'articolo_correlato_sku',
                'articolo_component_id',
                'articolo_component_sku',
                'component_id',
                'component_sku',
                'sku_component',
                'id',
                'sku_globale',
                'sku',
                'sku_articolo',
                'id_locale',
            ];

            foreach ($keys as $key) {
                if (isset($reference[$key]) && $reference[$key] !== '') {
                    $resolved = $this->resolveArticoloIdByReference($reference[$key], $tenantId, $restrictTenant);
                    if ($resolved !== null) {
                        return $resolved;
                    }
                }
            }

            return null;
        }

        $value = (string) $reference;
        if ($value === '') {
            return null;
        }

        if (ctype_digit($value)) {
            $params = [(int) $value];
            $sql = 'SELECT id FROM articoli WHERE id = ?';
            if ($restrictTenant && $tenantId !== null) {
                $sql .= ' AND tenant_id = ?';
                $params[] = $tenantId;
            }

            $row = $this->db->selectOne($sql, $params);
            if ($row) {
                return (int) $row['id'];
            }
        }

        $params = [$value];
        $sql = 'SELECT id FROM articoli WHERE sku_globale = ?';
        if ($restrictTenant && $tenantId !== null) {
            $sql .= ' AND tenant_id = ?';
            $params[] = $tenantId;
        }

        $row = $this->db->selectOne($sql, $params);

        return $row ? (int) $row['id'] : null;
    }

    private function resolveVarianteId(int $tenantId, array $payload, array $event): ?int
    {
        $candidate = $payload['id_variante_centrale']
            ?? $payload['variante_id']
            ?? $payload['sku']
            ?? $payload['variante_sku']
            ?? $event['entita_id']
            ?? null;

        if ($candidate === null) {
            return null;
        }

        if (is_numeric($candidate)) {
            $row = $this->db->selectOne(
                'SELECT v.id FROM articoli_varianti v INNER JOIN articoli a ON a.id = v.articolo_id WHERE v.id = ? AND a.tenant_id = ?',
                [(int) $candidate, $tenantId]
            );
            if ($row) {
                return (int) $row['id'];
            }
        }

        $row = $this->db->selectOne(
            'SELECT v.id FROM articoli_varianti v INNER JOIN articoli a ON a.id = v.articolo_id WHERE v.sku = ? AND a.tenant_id = ? LIMIT 1',
            [$candidate, $tenantId]
        );

        return $row ? (int) $row['id'] : null;
    }

    private function upsertListino(int $tenantId, array $listino): int
    {
        $codice = $listino['codice'];
        $nome = $listino['nome'] ?? $codice;
        $valuta = $listino['valuta'] ?? 'EUR';
        $validoDal = $listino['valido_dal'] ?? null;
        $validoAl = $listino['valido_al'] ?? null;
        $priorita = (int) ($listino['priorita'] ?? 0);

        $this->db->executeStatement(
            'INSERT INTO listini (tenant_id, codice, nome, valuta, valido_dal, valido_al, priorita)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                nome = VALUES(nome),
                valuta = VALUES(valuta),
                valido_dal = VALUES(valido_dal),
                valido_al = VALUES(valido_al),
                priorita = VALUES(priorita),
                aggiornato_il = NOW()',
            [
                $tenantId,
                $codice,
                $nome,
                $valuta,
                $validoDal,
                $validoAl,
                $priorita,
            ]
        );

        $row = $this->db->selectOne(
            'SELECT id FROM listini WHERE tenant_id = ? AND codice = ?',
            [$tenantId, $codice]
        );

        if (!$row) {
            throw new RuntimeException('Impossibile recuperare il listino inserito.');
        }

        return (int) $row['id'];
    }

    private function normalizeVariantiPayload(array $payload): array
    {
        if (isset($payload['varianti']) && is_array($payload['varianti'])) {
            return $payload['varianti'];
        }

        if (isset($payload['variante']) && is_array($payload['variante'])) {
            return [$payload['variante']];
        }

        if (!empty($payload)) {
            return [$payload];
        }

        return [];
    }

    private function parseDateTime(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            $dt = new DateTimeImmutable($value);
            return $dt->format('Y-m-d H:i:s');
        } catch (Throwable $e) {
            return null;
        }
    }
}
