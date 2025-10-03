USE hub_catalogo;

-- Tenant demo
INSERT INTO tenants (ragione_sociale, slug, stato)
VALUES ('Tenant Demo', 'tenant-demo', 'ATTIVO')
ON DUPLICATE KEY UPDATE stato = VALUES(stato);

SET @tenant_id = (SELECT id FROM tenants WHERE slug = 'tenant-demo');

-- Set attributi per servizi di noleggio
INSERT INTO set_attributi (nome, descrizione, tipologia_destinazione)
VALUES ('SERVIZI_NOLEGGIO', 'Attributi standard per servizi di noleggio', 'SERVIZIO')
ON DUPLICATE KEY UPDATE descrizione = VALUES(descrizione);

SET @set_id = (SELECT id FROM set_attributi WHERE nome = 'SERVIZI_NOLEGGIO');

INSERT INTO attributi (set_attributi_id, nome_tecnico, etichetta, tipo_dato, obbligatorio)
VALUES
  (@set_id, 'categoria_vehicle', 'Categoria veicolo', 'TESTO', 1),
  (@set_id, 'conducente_incluso', 'Conducente incluso', 'BOOLEANO', 0),
  (@set_id, 'chilometri_inclusi', 'Chilometri inclusi', 'NUMERO', 0)
ON DUPLICATE KEY UPDATE etichetta = VALUES(etichetta);

-- Tassonomia base
INSERT INTO categorie (nome, slug)
VALUES
  ('Automotive', 'automotive'),
  ('Noleggio', 'noleggio'),
  ('Servizi ausiliari', 'servizi-ausiliari')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @cat_auto = (SELECT id FROM categorie WHERE slug = 'automotive');
SET @cat_noleggio = (SELECT id FROM categorie WHERE slug = 'noleggio');
SET @cat_servizi = (SELECT id FROM categorie WHERE slug = 'servizi-ausiliari');

-- Articolo principale
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita, set_attributi_id)
VALUES
  (@tenant_id, 'TENANTDEMO-0001', 'SERVIZIO', 'Noleggio auto berlina', 'Auto 5 posti', 'Servizio di noleggio con chilometraggio base', 'PUBBLICATO', 'MARKETPLACE', @set_id)
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @articolo_id = (SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-0001');

INSERT IGNORE INTO articoli_categorie (articolo_id, categoria_id)
VALUES (@articolo_id, @cat_auto), (@articolo_id, @cat_noleggio);

INSERT INTO valori_attributi (articolo_id, variante_id, attributo_id, valore_testo, valore_booleano)
SELECT @articolo_id, NULL, a.id,
       CASE a.nome_tecnico WHEN 'categoria_vehicle' THEN 'BERLINA' END,
       CASE a.nome_tecnico WHEN 'conducente_incluso' THEN 0 END
FROM attributi a
WHERE a.set_attributi_id = @set_id
ON DUPLICATE KEY UPDATE valore_testo = VALUES(valore_testo), valore_booleano = VALUES(valore_booleano);

-- Variante principale
INSERT INTO articoli_varianti (articolo_id, sku, nome, stato)
VALUES (@articolo_id, 'TENANTDEMO-0001-A', 'Noleggio giornaliero', 'ATTIVO')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @variante_id = (SELECT id FROM articoli_varianti WHERE sku = 'TENANTDEMO-0001-A');

-- Scorte e disponibilità
INSERT INTO scorte (variante_id, tenant_id, magazzino_id, quantita_totale, quantita_disponibile, versione_sync)
VALUES (@variante_id, @tenant_id, 'HUB', 10, 10, 1)
ON DUPLICATE KEY UPDATE quantita_totale = VALUES(quantita_totale), quantita_disponibile = VALUES(quantita_disponibile);

INSERT INTO disponibilita_slot (variante_id, inizio, fine, capacita_totale, capacita_prenotata)
VALUES (@variante_id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, 3, 0)
ON DUPLICATE KEY UPDATE capacita_totale = VALUES(capacita_totale);

-- Listino e prezzo
INSERT INTO listini (tenant_id, codice, nome, valuta, valido_dal)
VALUES (@tenant_id, 'DEFAULT', 'Listino base', 'EUR', CURDATE())
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @listino_id = (SELECT id FROM listini WHERE tenant_id = @tenant_id AND codice = 'DEFAULT');

INSERT INTO prezzi_articoli (listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima)
VALUES (@listino_id, @variante_id, 65.00, 80.00, 1)
ON DUPLICATE KEY UPDATE prezzo = VALUES(prezzo), prezzo_confronto = VALUES(prezzo_confronto);

-- Risorsa multimediale
INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione)
VALUES (@tenant_id, @articolo_id, 'IMMAGINE', 'https://example.com/images/noleggio-berlina.jpg', 'Auto berlina', 1)
ON DUPLICATE KEY UPDATE url = VALUES(url);

-- Servizio ausiliario correlato
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita)
VALUES (@tenant_id, 'TENANTDEMO-0002', 'SERVIZIO', 'Servizio auto sostitutiva', 'Veicolo sostitutivo', 'Servizio complementare per clienti in attesa di riparazione', 'PUBBLICATO', 'MARKETPLACE')
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @ausiliario_id = (SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-0002');

INSERT INTO articoli_relazioni (articolo_sorgente_id, articolo_correlato_id, tipo_relazione, priorita)
VALUES (@articolo_id, @ausiliario_id, 'SERVIZIO_AUSILIARIO', 10)
ON DUPLICATE KEY UPDATE priorita = VALUES(priorita);

